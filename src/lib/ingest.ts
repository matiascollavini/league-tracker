import type { Platform } from "@/lib/riot/config";
import { getMatch, getMatchIdsPage, historyWindowStart } from "@/lib/riot/matches";
import { resolveAccount } from "@/lib/riot/account";
import { RiotApiError, RiotDeadlineError } from "@/lib/riot/http";
import { checkNewestMatch } from "@/lib/sync-status";
import type { Account, Match } from "@/lib/riot/types";
import {
  filterKnownMatchIds,
  forgetMatchId,
  getAliasPuuids,
  getProgress,
  getSyncState,
  pendingMatchIds,
  registerMatchIds,
  saveMatch,
  touchSyncState,
  tryLockSync,
  unlockSync,
  type Progress,
} from "@/lib/db/matches";

/**
 * Ingesta: descubre IDs de partidas y baja los detalles que falten.
 *
 * Presupuesto: cada request a Riot cuesta 1. Con dev key hay 100 cada 2 min,
 * así que la función acepta `budget` para no pasarse. Es resumible: si corta
 * a la mitad, la próxima corrida sigue donde quedó (los IDs están guardados y
 * solo baja los detalles que faltan).
 */

export type IngestOptions = {
  /** Requests totales permitidos en esta corrida. */
  budget?: number;
  /** Páginas de 100 IDs a recorrer (máx. 10 = ~1.000 partidas). */
  maxPages?: number;
  /**
   * Tope de tiempo de la corrida, en ms. Al vencer, la corrida devuelve lo que
   * hizo en vez de seguir: es lo que evita que la función serverless se pase de
   * `maxDuration` y muera sin soltar el lock. Sin este valor no hay tope (CLI y
   * worker, que ya tienen el suyo por fuera).
   */
  deadlineMs?: number;
  /**
   * Hora límite en epoch ms (alternativa absoluta a `deadlineMs`). La usa el
   * route para que resolver el Riot ID y bajar partidas compartan el mismo
   * presupuesto en vez de sumar uno detrás del otro.
   */
  deadlineAt?: number;
  /** Se llama por cada partida guardada (para logs del CLI). */
  onProgress?: (message: string) => void;
  /** Nombre para mostrar en la tabla de estado (opcional). */
  gameName?: string;
  tagLine?: string;
};

export type IngestPhase = "ids" | "details" | "done" | "locked" | "throttled";

export type IngestResult = {
  puuid: string;
  progress: Progress;
  requests: number;
  /** true si ya se recorrió todo el historial disponible y no quedan pendientes. */
  done: boolean;
  /** El lock lo tenía otro proceso: no se hizo nada. */
  skipped: boolean;
  /** Qué estaba haciendo (o por qué no hizo nada). */
  phase: IngestPhase;
  /** Duración de la corrida. */
  elapsedMs: number;
  /** Si se cortó por lock: cuánto le queda al lock ajeno (ms). */
  lockForMs?: number;
  /** Partidas descartadas porque Riot ya no las tiene (404). */
  unavailable: number;
  /**
   * Si la vuelta se cortó por rate limit: ms que conviene esperar antes de
   * reintentar. Sin esto el cliente reintenta al toque y no hay turno todavía.
   */
  retryAfterMs?: number;
  /**
   * ¿Riot confirma que no hay partidas más nuevas que las cargadas? Es lo que
   * decide el "Actualizado" del botón. `null` = no se pudo verificar (sin
   * presupuesto, 429, timeout): no se afirma nada. Ojo: `done` solo habla de
   * nuestra cola, no de Riot.
   */
  upToDate: boolean | null;
};

/** Resuelve el Riot ID y delega. Atajo para el CLI y la visita al perfil. */
export async function syncAccount(
  platform: Platform,
  gameName: string,
  tagLine: string,
  options: IngestOptions = {},
): Promise<IngestResult & { account: Account }> {
  const deadlineAt =
    options.deadlineAt ??
    (options.deadlineMs && options.deadlineMs > 0
      ? Date.now() + options.deadlineMs
      : undefined);

  const account = await resolveAccount(platform, gameName, tagLine, deadlineAt);
  const result = await syncPuuid(account.puuid, platform, {
    ...options,
    deadlineAt,
    gameName: account.gameName ?? gameName,
    tagLine: account.tagLine ?? tagLine,
  });
  return { ...result, account };
}

/**
 * Núcleo. Trabaja con el puuid, que es lo estable: el worker no gasta el
 * request de resolver el Riot ID si ya lo tiene guardado.
 */
export async function syncPuuid(
  puuid: string,
  platform: Platform,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const startedAt = Date.now();
  const budget = Math.max(1, options.budget ?? 30);
  let remaining = budget;

  // Deadline: hora (epoch ms) después de la cual no se empieza ninguna request.
  const deadline =
    options.deadlineAt ??
    (options.deadlineMs && options.deadlineMs > 0
      ? startedAt + options.deadlineMs
      : undefined);

  const previous = await getSyncState(puuid);
  const done = previous?.backfillState === "done";
  // Si el backfill ya terminó, alcanza con la primera página (partidas nuevas).
  // Si quedó a medias, se retoma desde el cursor en vez de repetir lo ya visto.
  const maxPages = done ? 1 : Math.max(1, options.maxPages ?? 10);
  const resumeFrom = done
    ? 1
    : Math.max(1, Math.floor((previous?.idsCursor ?? 0) / 100));

  // Página 0 siempre (partidas nuevas) + continuación del backfill.
  const pages = Array.from({ length: maxPages }, (_, index) =>
    index === 0 ? 0 : resumeFrom + index - 1,
  );

  const since = historyWindowStart();

  // El lock tiene que durar lo que dura la corrida, no más: 10 minutos por una
  // vuelta de 40 s dejan la cuenta trabada si la función muere sin soltarlo.
  const lockSeconds = deadline
    ? Math.ceil((deadline - startedAt) / 1_000) + 30
    : 600;
  const lock = await tryLockSync(puuid, platform, lockSeconds);
  if (!lock) {
    const state = await getSyncState(puuid);
    return {
      puuid,
      progress: await getProgress(await getAliasPuuids(puuid)),
      requests: 0,
      done: false,
      skipped: true,
      phase: "locked",
      elapsedMs: Date.now() - startedAt,
      lockForMs:
        state?.lockedUntil == null
          ? undefined
          : Math.max(0, state.lockedUntil - Date.now()),
      unavailable: 0,
      upToDate: null,
    };
  }

  let phase: IngestPhase = "ids";
  let reachedEnd = false;
  let unavailable = 0;
  // Se completa adentro del try; el catch (deadline) también necesita el progreso.
  let puuids: string[] = [puuid];

  try {
    await touchSyncState(puuid, platform, {
      gameName: options.gameName,
      tagLine: options.tagLine,
      backfillState: "running",
    });

    // Todos los puuids de la misma persona (Riot los reasigna): el progreso y
    // la cola de detalles se calculan sobre el conjunto, no sobre uno solo.
    puuids = await getAliasPuuids(puuid);

    let cursor = previous?.idsCursor ?? 0;

    try {
      for (const page of pages) {
        if (remaining <= 0) break;
        if (deadline !== undefined && Date.now() >= deadline) break;

        const start = page * 100;
        const ids = await getMatchIdsPage(
          puuid,
          platform,
          start,
          100,
          since,
          deadline,
        );
        remaining -= 1;

        if (ids.length === 0) {
          reachedEnd = true;
          break;
        }

        await registerMatchIds(puuid, ids);
        cursor = start + ids.length;
        options.onProgress?.(`página ${page + 1}: ${ids.length} IDs`);

        if (ids.length < 100) {
          reachedEnd = true;
          break;
        }
      }
    } finally {
      // Aunque la corrida se corte acá, el cursor queda guardado. Ojo: con el
      // backfill ya completo solo se lee la página 0, así que `reachedEnd` es
      // false por definición y degradar a "partial" haría que la cuenta vuelva
      // a la cola del worker en cada vuelta.
      await touchSyncState(puuid, platform, {
        idsCursor: cursor,
        backfillState: reachedEnd || done ? "done" : "partial",
      });
    }

    // Detalles pendientes (en tandas, para no armar arrays gigantes).
    while (remaining > 0) {
      if (deadline !== undefined && Date.now() >= deadline) break;
      phase = "details";

      const pending = await pendingMatchIds(puuids, Math.min(remaining, 20));
      if (pending.length === 0) break;

      const known = new Set(await filterKnownMatchIds(pending));
      let touched = 0;

      for (const matchId of pending) {
        if (remaining <= 0) break;
        if (deadline !== undefined && Date.now() >= deadline) break;
        if (known.has(matchId)) continue;

        let match: Match;
        try {
          match = await getMatch(matchId, platform, deadline);
        } catch (error) {
          // Riot ya no tiene esa partida (retención de 2 años, ID roto): sale de
          // la cola, si no sería siempre la primera y trabaría el backfill.
          if (
            error instanceof RiotApiError &&
            (error.status === 404 || error.status === 400)
          ) {
            await forgetMatchId(puuid, matchId);
            unavailable += 1;
            touched += 1;
            options.onProgress?.(`descartada ${matchId} (Riot no la tiene)`);
            continue;
          }
          throw error;
        }

        // ¿La partida lo lista de verdad? Si Riot nos devolvió el ID pero el
        // payload no lo incluye (puuid viejo, partida de otra persona), el link
        // no sirve: se descarta para que el progreso cierre.
        if (!match.info.participants.some((p) => puuids.includes(p.puuid))) {
          await forgetMatchId(puuid, matchId);
          unavailable += 1;
          touched += 1;
          options.onProgress?.(`descartada ${matchId} (Riot no lo lista)`);
          continue;
        }

        remaining -= 1;
        await saveMatch(match, platform);
        touched += 1;
        options.onProgress?.(`guardada ${matchId}`);
      }

      // Nada nuevo en esta tanda (otro proceso las bajó): no repitas la query.
      if (touched === 0) break;
    }

    await touchSyncState(puuid, platform, { lastSyncedAt: Date.now() });

    const progress = await getProgress(puuids);
    const complete = (reachedEnd || done) && progress.detailed >= progress.known;

    // `complete` solo dice que nuestra cola está drenada. Riot puede tener una
    // partida más nueva que nunca llegó a registrarse; se verifica con 1 request
    // (cache 45 s) para que el cliente no diga "Actualizado" sin prueba.
    let upToDate: boolean | null = false;
    if (complete) {
      upToDate = null;
      if (remaining > 0) {
        remaining -= 1;
        const check = await checkNewestMatch(puuids, platform, { deadline });
        upToDate = check.upToDate;
        options.onProgress?.(
          upToDate === true
            ? "Riot confirma que no hay partidas más nuevas"
            : upToDate === false
              ? "Riot tiene una partida más nueva que no pudimos cargar"
              : "no se pudo verificar contra Riot",
        );
      }
    }

    return {
      puuid,
      progress,
      requests: budget - remaining,
      done: complete,
      skipped: false,
      phase: complete ? "done" : phase,
      elapsedMs: Date.now() - startedAt,
      unavailable,
      upToDate,
    };
  } catch (error) {
    // El deadline no es un error: es el final normal de una vuelta acotada.
    if (!(error instanceof RiotDeadlineError)) throw error;

    await touchSyncState(puuid, platform, { lastSyncedAt: Date.now() });
    const progress = await getProgress(puuids);
    options.onProgress?.(
      "se acabó el tiempo: lo que falta sigue en la próxima vuelta",
    );

    return {
      puuid,
      progress,
      requests: budget - remaining,
      done: false,
      skipped: false,
      phase,
      elapsedMs: Date.now() - startedAt,
      unavailable,
      // La corrida se cortó antes de verificar: no hay prueba.
      upToDate: null,
      retryAfterMs:
        error.retryAfterMs > 0
          ? Math.min(120_000, Math.round(error.retryAfterMs))
          : undefined,
    };
  } finally {
    await unlockSync(puuid, lock);
  }
}
