import type { Platform } from "@/lib/riot/config";
import { getLeagueEntries, getSummoner, resolveAccount } from "@/lib/riot/account";
import { getRecentMatches } from "@/lib/riot/matches";
import { isMockMode } from "@/lib/riot/http";
import { getPlayerMatches, getProgress, type Progress } from "@/lib/db/matches";
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
  matches: Match[];
  progress: Progress;
  summoner: Summoner | null;
  league: LeagueEntry[];
  source: ProfileSource;
  /** El historial todavía se está bajando (detailed < known). */
  partial: boolean;
};

/** Requests que se permiten gastar durante la visita de un usuario. */
const ON_DEMAND_BUDGET = 25;
/** Si hay menos partidas que esto en la base, vale la pena sincronizar. */
const MIN_TO_ANALYZE = 20;

export async function loadProfile(
  platform: Platform,
  gameName: string,
  tagLine: string,
): Promise<ProfileData> {
  const account = await resolveAccount(platform, gameName, tagLine);

  const [summoner, league] = await Promise.all([
    getSummoner(account.puuid, platform),
    getLeagueEntries(account.puuid, platform),
  ]);

  if (isMockMode()) {
    const matches = await getRecentMatches(account.puuid, platform);
    return {
      account,
      matches,
      progress: { known: matches.length, detailed: matches.length },
      summoner,
      league,
      source: "demo",
      partial: false,
    };
  }

  let progress = await getProgress(account.puuid);

  if (progress.detailed < MIN_TO_ANALYZE) {
    try {
      const result = await syncAccount(platform, gameName, tagLine, {
        budget: ON_DEMAND_BUDGET,
        maxPages: 1,
      });
      progress = result.progress;
    } catch (error) {
      // 429 o 5xx: no rompemos la página, seguimos con lo que haya.
      console.warn(
        "[profile] la sincronización al vuelo falló:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  let matches =
    progress.detailed > 0 ? await getPlayerMatches(account.puuid) : [];
  let source: ProfileSource = "db";

  if (matches.length === 0) {
    matches = await getRecentMatches(account.puuid, platform);
    source = "live";
    progress = { known: matches.length, detailed: matches.length };
  }

  return {
    account,
    matches,
    progress,
    summoner,
    league,
    source,
    partial: progress.detailed < progress.known,
  };
}
