import type { Platform } from "@/lib/riot/config";
import { getLeagueEntries, getSummoner, resolveAccount } from "@/lib/riot/account";
import { getRecentMatches } from "@/lib/riot/matches";
import { checkNewestMatch } from "@/lib/sync-status";
import { isMockMode } from "@/lib/riot/http";
import { mockLeagueHistory } from "@/lib/riot/fixtures";
import {
  extendRankHistory,
  RANKED_QUEUE_TYPES,
  type RankHistoryEntry,
} from "@/lib/riot/rank-history";
import {
  findSyncedPuuid,
  findSyncForPuuid,
  getAliasPuuids,
  getLeagueSnapshot,
  getPlayerMatchesWithProgress,
  saveLeagueSnapshot,
  type Progress,
} from "@/lib/db/matches";
import { getLeagueHistory, recordLeagueHistory } from "@/lib/db/rank-history";
import { syncAccount } from "@/lib/ingest";
import { saveAccount } from "@/lib/db/accounts";
import type { Account, LeagueEntry, Match, Summoner } from "@/lib/riot/types";

/**
 * Lectura del perfil.
 *
 * Orden de preferencia:
 *   1. Base de datos (rápido, 0 requests, hasta ~1.000 partidas).
 *   2. Si la base no tiene al jugador, sincroniza un poquito (25 requests) y
 *      vuelve a leer.
 *   3. Si aun así no hay nada, cae a la vía directa de 24 partidas.
 */

export type ProfileSource = "db" | "live" | "demo";

export type ProfileData = {
  account: Account;
  /** Puuid efectivo: el resuelto o el que ya tenía datos. */
  puuid: string;
  /** Todos los puuids del jugador (Riot los reasigna); se agrega sobre el conjunto. */
  puuids: string[];
  /** Plataforma efectiva: la de la URL o la que tiene los datos guardados. */
  platform: Platform;
  /** true si la plataforma de la URL no era la de la cuenta. */
  platformMismatch: boolean;
  /** El rango viene de una foto guardada (Riot no respondió). */
  rankStale: boolean;
  matches: Match[];
  progress: Progress;
  summoner: Summoner | null;
  league: LeagueEntry[];
  /**
   * Fotos de rango guardadas (ADR-026). Riot no da historial: esto es lo que
   * venimos observando nosotros, por cola. Puede estar vacío o tener un solo
   * punto si el jugador es nuevo para nosotros.
   */
  rankHistory: RankHistoryEntry[];
  source: ProfileSource;
  /** El historial todavía se está bajando (detailed < known). */
  partial: boolean;
  /**
   * No queda nada por analizar Y el backfill ya recorrió todo el historial de
   * Riot: el botón de "cargar todo" no tiene nada que hacer y se esconde.
   */
  complete: boolean;
  /**
   * Riot tiene partidas (o IDs que no tenemos) que la página todavía no puede
   * mostrar. Se calcula contra Riot, no solo contra nuestra cola.
   */
  /**
   * Riot tiene una partida más nueva que la que tenemos cargada para **este**
   * jugador (verificado, no una suposición).
   */
  hasNewMatches: boolean;
  /**
   * No se pudo consultar a Riot si hay partidas nuevas (429/5xx/timeout).
   * En ese caso `upToDate` es false por precaución, pero no porque haya algo
   * pendiente: el botón lo explica en vez de mostrar un "Actualizar" seco.
   */
  verificationUnknown: boolean;
  /**
   * El perfil está al día: nada pendiente, backfill recorrido y la partida más
   * nueva de Riot ya está en la base. Es lo que muestra el botón ("Actualizado"
   * vs "Actualizar"). Conservador: si no se pudo verificar, es false.
   */
  upToDate: boolean;
};

/**
 * Requests que se permiten gastar durante la visita de un usuario.
 * Con dev key dejalo bajo (25): a ~1 rps, 25 requests son ~30 s.
 * Con production key se puede subir a 300-400 y el perfil queda completo en la
 * primera búsqueda (~10-20 s), sin esperar al worker.
 */
function onDemandBudget(): number {
  const raw = Number(process.env.RIOT_ONDEMAND_BUDGET ?? 25);
  if (!Number.isFinite(raw)) return 25;
  return Math.min(600, Math.max(0, Math.floor(raw)));
}
/** Si hay menos partidas que esto en la base, vale la pena sincronizar. */
const MIN_TO_ANALYZE = 20;

export async function loadProfile(
  platform: Platform,
  gameName: string,
  tagLine: string,
): Promise<ProfileData> {
  const account = await resolveAccount(platform, gameName, tagLine);

  // El puuid es la identidad; la plataforma es metadata. Si la cuenta ya está
  // guardada bajo otra región (ej. buscás en LAN una cuenta de LAS), usamos esa.
  let puuid = account.puuid;
  let effectivePlatform = platform;

  if (!isMockMode()) {
    const owner =
      (await findSyncForPuuid(puuid)) ??
      (await findSyncedPuuid(gameName, tagLine));

    if (owner) {
      puuid = owner.puuid;
      effectivePlatform = owner.platform;
    }
  }

  const [summonerApi, leagueApi] = await Promise.all([
    getSummoner(puuid, effectivePlatform),
    getLeagueEntries(puuid, effectivePlatform),
  ]);

  if (isMockMode()) {
    const matches = await getRecentMatches(puuid, effectivePlatform);
    return {
      account,
      puuid,
      puuids: [puuid],
      platform: effectivePlatform,
      platformMismatch: effectivePlatform !== platform,
      rankStale: false,
      matches,
      progress: { known: matches.length, detailed: matches.length },
      summoner: summonerApi,
      league: leagueApi,
      rankHistory: mockLeagueHistory(),
      source: "demo",
      partial: false,
      // Sin key no hay nada que sincronizar: el aviso de "cargar" no aplica.
      complete: true,
      hasNewMatches: false,
      verificationUnknown: false,
      upToDate: true,
    };
  }

  // Un jugador puede tener varios puuids (Riot los reasigna): se lee el conjunto.
  // Incluye el que devolvió Riot en esta visita, que puede no tener fila todavía.
  const playerPuuids = [
    ...new Set([
      account.puuid,
      ...(await getAliasPuuids(puuid, {
        gameName: account.gameName ?? gameName,
        tagLine: account.tagLine ?? tagLine,
      })),
    ]),
  ];

  // Una sola consulta trae partidas + progreso + si está en la cola.
  let { matches, progress, queued, backfillState } =
    await getPlayerMatchesWithProgress(playerPuuids);

  // Fallback: si summoner-v4 falla, el icono y el nivel salen de la última
  // partida guardada (los mandó Riot en el payload del match).
  const newestPlayer = matches[0]?.info.participants[0];
  const summoner =
    summonerApi ??
    (newestPlayer?.profileIcon
      ? {
          puuid,
          profileIconId: newestPlayer.profileIcon,
          summonerLevel: newestPlayer.summonerLevel,
        }
      : null);
  // Rango: si league-v4 no devuelve nada, usamos la última foto guardada.
  let league = leagueApi;
  let rankStale = false;
  if (league.length > 0) {
    // Además de la foto para el fallback (una fila por puuid), se guarda la
    // foto en el historial. El insert es condicional: si tier/división/LP no
    // cambiaron, no escribe nada. Se espera (es barato) para que el gráfico
    // incluya la medición de esta misma visita.
    try {
      await Promise.all([
        saveLeagueSnapshot(puuid, effectivePlatform, league),
        recordLeagueHistory(puuid, effectivePlatform, league),
      ]);
    } catch {
      // El rango actual ya está en memoria: si falla la escritura, la página
      // sigue. Lo único que se pierde es un punto del gráfico.
    }
  } else {
    const snapshot = await getLeagueSnapshot(puuid);
    if (snapshot && snapshot.entries.length > 0) {
      league = snapshot.entries as typeof league;
      rankStale = true;
    }
  }
  const rankHistory = extendRankHistory(
    await getLeagueHistory(playerPuuids, RANKED_QUEUE_TYPES).catch(() => []),
    Date.now(),
    // Con la foto de fallback o sin rango actual no se puede afirmar que el
    // último valor siga vigente.
    { stale: rankStale || league.length === 0 },
  );

  // El índice del buscador del header se entera de esta cuenta (y del icono y
  // nivel reales) en la primera visita. Es un upsert chico, fire-and-forget:
  // no debe demorar ni romper el render del perfil.
  void saveAccount({
    puuid,
    platformId: effectivePlatform,
    gameName: account.gameName ?? gameName,
    tagLine: account.tagLine ?? tagLine,
    profileIcon: summoner?.profileIconId ?? null,
    level: summoner?.summonerLevel ?? null,
    lastSeenTs: Date.now(),
  }).catch(() => {});

  // Ojo con "tiene algunas partidas": quien aparece como participante de las
  // partidas de otro tiene links pero NUNCA estuvo en la cola del worker, así
  // que su historial propio no se pidió nunca y el perfil quedaba congelado en
  // "N de N". Si no está en la cola, se sincroniza en esta visita.
  if (progress.detailed < MIN_TO_ANALYZE || !queued) {
    try {
      const result = await syncAccount(effectivePlatform, gameName, tagLine, {
        budget: onDemandBudget(),
        maxPages: 4,
        // La visita tampoco puede colgarse: si no entra, el worker sigue.
        deadlineMs: 30_000,
      });
      puuid = result.puuid;
      ({ matches, progress, queued, backfillState } =
        await getPlayerMatchesWithProgress([
          ...new Set([puuid, ...playerPuuids]),
        ]));
    } catch (error) {
      // 429 o 5xx: no rompemos la página, seguimos con lo que haya.
      console.warn(
        "[profile] la sincronización al vuelo falló:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  let source: ProfileSource = "db";

  if (matches.length === 0) {
    matches = await getRecentMatches(puuid, platform);
    source = "live";
    progress = { known: matches.length, detailed: matches.length };
  }

  // ¿Riot tiene una partida más nueva que la que tenemos? Es 1 request (solo el
  // ID) y cachea 45 s. Sin esto, una partida jugada después del último sync no
  // figura en `known` y el botón decía "al día" mintiendo. Se compara contra el
  // link del jugador (no contra la tabla `matches`, que es compartida).
  const verification =
    source === "db" && !isMockMode()
      ? await checkNewestMatch(
          // El puuid fresco de account-v1 va primero: es a quien Riot le
          // asigna las partidas nuevas. El resto son alias para el "ya está
          // cargada" (Riot reasigna puuids).
          [...new Set([account.puuid, puuid, ...playerPuuids])],
          effectivePlatform,
        )
      : { upToDate: null, newestMatchId: null };
  const hasNewMatches = verification.upToDate === false;
  const verificationUnknown =
    source === "db" && !isMockMode() && verification.upToDate === null;

  return {
    account,
    puuid,
    puuids: [...new Set([puuid, ...playerPuuids])],
    platform: effectivePlatform,
    platformMismatch: effectivePlatform !== platform,
    rankStale,
    matches,
    progress,
    summoner,
    league,
    rankHistory,
    source,
    partial: progress.detailed < progress.known,
    // Solo cuenta como completo si los datos salen de la base: la vía directa
    // (24 partidas en vivo) siempre tiene algo más para traer.
    complete:
      source === "db" &&
      backfillState === "done" &&
      progress.detailed >= progress.known,
    hasNewMatches,
    verificationUnknown,
    upToDate:
      source !== "live" &&
      !isMockMode() &&
      verification.upToDate === true &&
      progress.detailed >= progress.known &&
      backfillState === "done",
  };
}
