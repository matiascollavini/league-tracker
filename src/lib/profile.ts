import type { Platform } from "@/lib/riot/config";
import { getLeagueEntries, getSummoner, resolveAccount } from "@/lib/riot/account";
import { getRecentMatches } from "@/lib/riot/matches";
import { isMockMode } from "@/lib/riot/http";
import {
  findSyncedPuuid,
  findSyncForPuuid,
  getPlayerMatchesWithProgress,
  type Progress,
} from "@/lib/db/matches";
import { syncAccount } from "@/lib/ingest";
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
  /** Plataforma efectiva: la de la URL o la que tiene los datos guardados. */
  platform: Platform;
  /** true si la plataforma de la URL no era la de la cuenta. */
  platformMismatch: boolean;
  matches: Match[];
  progress: Progress;
  summoner: Summoner | null;
  league: LeagueEntry[];
  source: ProfileSource;
  /** El historial todavía se está bajando (detailed < known). */
  partial: boolean;
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

  const [summoner, league] = await Promise.all([
    getSummoner(puuid, effectivePlatform),
    getLeagueEntries(puuid, effectivePlatform),
  ]);

  if (isMockMode()) {
    const matches = await getRecentMatches(puuid, effectivePlatform);
    return {
      account,
      puuid,
      platform: effectivePlatform,
      platformMismatch: effectivePlatform !== platform,
      matches,
      progress: { known: matches.length, detailed: matches.length },
      summoner,
      league,
      source: "demo",
      partial: false,
    };
  }

  // Una sola consulta trae partidas + progreso.
  let { matches, progress } = await getPlayerMatchesWithProgress(puuid);

  if (progress.detailed < MIN_TO_ANALYZE) {
    try {
      const result = await syncAccount(effectivePlatform, gameName, tagLine, {
        budget: onDemandBudget(),
        maxPages: 4,
      });
      puuid = result.puuid;
      ({ matches, progress } = await getPlayerMatchesWithProgress(puuid));
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
    platform: effectivePlatform,
    platformMismatch: effectivePlatform !== platform,
    matches,
    progress,
    summoner,
    league,
    source,
    partial: progress.detailed < progress.known,
  };
}
