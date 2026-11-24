import type { Platform } from "@/lib/riot/config";
import { getLeagueEntries, getSummoner, resolveAccount } from "@/lib/riot/account";
import { getRecentMatches } from "@/lib/riot/matches";
import { isMockMode } from "@/lib/riot/http";
import {
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

  // Una sola consulta trae partidas + progreso.
  let { matches, progress } = await getPlayerMatchesWithProgress(account.puuid);

  if (progress.detailed < MIN_TO_ANALYZE) {
    try {
      await syncAccount(platform, gameName, tagLine, {
        budget: onDemandBudget(),
        maxPages: 4,
      });
      ({ matches, progress } = await getPlayerMatchesWithProgress(account.puuid));
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
