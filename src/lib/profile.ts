import type { Platform } from "@/lib/riot/config";
import { getLeagueEntries, getSummoner, resolveAccount } from "@/lib/riot/account";
import { getRecentMatches } from "@/lib/riot/matches";
import { isMockMode } from "@/lib/riot/http";
import {
  findSyncedPuuid,
  findSyncForPuuid,
  getAliasPuuids,
  getLeagueSnapshot,
  getPlayerMatchesWithProgress,
  saveLeagueSnapshot,
  type Progress,
} from "@/lib/db/matches";
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
  source: ProfileSource;
  /** El historial todavía se está bajando (detailed < known). */
  partial: boolean;
  /**
   * No queda nada por analizar Y el backfill ya recorrió todo el historial de
   * Riot: el botón de "cargar todo" no tiene nada que hacer y se esconde.
   */
  complete: boolean;
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
      source: "demo",
      partial: false,
      // Sin key no hay nada que sincronizar: el aviso de "cargar" no aplica.
      complete: true,
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
    void saveLeagueSnapshot(puuid, effectivePlatform, league).catch(() => {});
  } else {
    const snapshot = await getLeagueSnapshot(puuid);
    if (snapshot && snapshot.entries.length > 0) {
      league = snapshot.entries as typeof league;
      rankStale = true;
    }
  }

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
    source,
    partial: progress.detailed < progress.known,
    // Solo cuenta como completo si los datos salen de la base: la vía directa
    // (24 partidas en vivo) siempre tiene algo más para traer.
    complete:
      source === "db" &&
      backfillState === "done" &&
      progress.detailed >= progress.known,
  };
}
