import type { Platform } from "./config";
import { isMockMode, mapLimit, riotFetch, RiotApiError } from "./http";
import { mockMatches } from "./fixtures";
import { MatchIdsSchema, MatchSchema, type Match } from "./types";

/** Cuántas partidas analizamos por perfil (default 24, tope 100). */
export function analyzeCount(): number {
  const raw = Number(process.env.RIOT_ANALYZE_COUNT ?? 24);
  const value = Number.isFinite(raw) ? Math.floor(raw) : 24;
  return Math.min(100, Math.max(1, value));
}

/**
 * MATCH-V5. Host REGIONAL (no plataforma). count va de 0 a 100.
 * Cache corto: la lista de IDs cambia con cada partida nueva.
 */
export async function getRecentMatches(
  puuid: string,
  platform: Platform,
  count = analyzeCount(),
): Promise<Match[]> {
  if (isMockMode()) {
    return mockMatches().slice(0, count);
  }

  const ids = await riotFetch(
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
    { platform, revalidate: 120, schema: MatchIdsSchema },
  ).catch((error: unknown) => {
    // 404 = el jugador no tiene partidas. No es un error de la página.
    if (error instanceof RiotApiError && error.status === 404) return [];
    throw error;
  });

  const details = await mapLimit(ids, 4, async (matchId) => {
    try {
      return await riotFetch(`/lol/match/v5/matches/${matchId}`, {
        platform,
        // Una partida terminada es inmutable: cache larga.
        revalidate: 2_592_000,
        schema: MatchSchema,
      });
    } catch (error) {
      // Una partida puede no estar disponible (borrada/retention). No rompemos
      // la página por una sola.
      if (error instanceof RiotApiError) return null;
      throw error;
    }
  });

  return details.filter((match): match is Match => match !== null);
}

/** Trae el detalle de una partida puntual (para features futuras). */
export async function getMatch(
  matchId: string,
  platform: Platform,
): Promise<Match> {
  if (isMockMode()) {
    const found = mockMatches().find((m) => m.metadata.matchId === matchId);
    if (!found) throw new RiotApiError(404, "Partida no encontrada", matchId);
    return found;
  }
  return riotFetch(`/lol/match/v5/matches/${matchId}`, {
    platform,
    revalidate: 2_592_000,
    schema: MatchSchema,
  });
}
