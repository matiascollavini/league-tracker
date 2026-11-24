import type { Platform } from "@/lib/riot/config";
import { getMatch, getMatchIdsPage, historyWindowStart } from "@/lib/riot/matches";
import { resolveAccount } from "@/lib/riot/account";
import type { Account, Match } from "@/lib/riot/types";
import {
  filterKnownMatchIds,
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
  /** Se llama por cada partida guardada (para logs del CLI). */
  onProgress?: (message: string) => void;
  /** Nombre para mostrar en la tabla de estado (opcional). */
  gameName?: string;
  tagLine?: string;
};

export type IngestResult = {
  puuid: string;
  progress: Progress;
  requests: number;
  /** true si ya se recorrió todo el historial disponible y no quedan pendientes. */
  done: boolean;
  /** El lock lo tenía otro proceso: no se hizo nada. */
  skipped: boolean;
};

/** Resuelve el Riot ID y delega. Atajo para el CLI y la visita al perfil. */
export async function syncAccount(
  platform: Platform,
  gameName: string,
  tagLine: string,
  options: IngestOptions = {},
): Promise<IngestResult & { account: Account }> {
  const account = await resolveAccount(platform, gameName, tagLine);
  const result = await syncPuuid(account.puuid, platform, {
    ...options,
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
  const budget = Math.max(1, options.budget ?? 30);
  let remaining = budget;

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

  const lock = await tryLockSync(puuid, platform, 600);
  if (!lock) {
    return {
      puuid,
      progress: await getProgress(puuid),
      requests: 0,
      done: false,
      skipped: true,
    };
  }

  try {
    await touchSyncState(puuid, platform, {
      gameName: options.gameName,
      tagLine: options.tagLine,
      backfillState: "running",
    });

    let cursor = previous?.idsCursor ?? 0;
    let reachedEnd = false;

    for (const page of pages) {
      if (remaining <= 0) break;

      const start = page * 100;
      const ids = await getMatchIdsPage(puuid, platform, start, 100, since);
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

    await touchSyncState(puuid, platform, {
      idsCursor: cursor,
      backfillState: reachedEnd ? "done" : "partial",
    });

    // Detalles pendientes (en tandas, para no armar arrays gigantes).
    while (remaining > 0) {
      const pending = await pendingMatchIds(puuid, Math.min(remaining, 20));
      if (pending.length === 0) break;

      const known = new Set(await filterKnownMatchIds(pending));
      for (const matchId of pending) {
        if (remaining <= 0) break;
        if (known.has(matchId)) continue;

        const match: Match = await getMatch(matchId, platform);
        remaining -= 1;
        await saveMatch(match, platform);
        options.onProgress?.(`guardada ${matchId}`);
      }
    }

    await touchSyncState(puuid, platform, { lastSyncedAt: Date.now() });

    const progress = await getProgress(puuid);
    return {
      puuid,
      progress,
      requests: budget - remaining,
      done: reachedEnd && progress.detailed >= progress.known,
      skipped: false,
    };
  } finally {
    await unlockSync(puuid, lock);
  }
}
