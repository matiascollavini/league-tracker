import { clusterFor, type Platform } from "./config";
import { isMockMode, mapLimit, riotFetch, RiotApiError } from "./http";
import { mockMatches } from "./fixtures";
import { MatchIdsSchema, MatchSchema, type Match } from "./types";

/** Cuántas partidas analizamos por perfil (default 24, tope 100). */
export function analyzeCount(): number {
  const raw = Number(process.env.RIOT_ANALYZE_COUNT ?? 24);
  const value = Number.isFinite(raw) ? Math.floor(raw) : 24;
  return Math.min(100, Math.max(1, value));
}

/** Riot retiene 2 años de historial: pedimos explícitamente esa ventana. */
export const HISTORY_WINDOW_DAYS = 730;

export function historyWindowStart(now = Date.now()): number {
  return Math.floor((now - HISTORY_WINDOW_DAYS * 86_400_000) / 1_000);
}

/** Una página de IDs (count 0..100). Host REGIONAL. */
export async function getMatchIdsPage(
  puuid: string,
  platform: Platform,
  start = 0,
  count = 100,
  sinceSeconds?: number,
  deadline?: number,
): Promise<string[]> {
  if (isMockMode()) {
    return mockMatches()
      .slice(start, start + count)
      .map((match) => match.metadata.matchId);
  }

  const since = sinceSeconds ? `&startTime=${sinceSeconds}` : "";
  return riotFetch(
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}${since}`,
    // MATCH-V5 vive en el host REGIONAL.
    { cluster: clusterFor(platform), revalidate: 120, schema: MatchIdsSchema, deadline },
  ).catch((error: unknown) => {
    // 404 = el jugador no tiene partidas. No es un error de la página.
    if (error instanceof RiotApiError && error.status === 404) return [];
    throw error;
  });
}

/**
 * El matchId MÁS NUEVO de Riot para este jugador (1 request, solo el ID).
 *
 * Es la única forma de saber si jugó algo que todavía NO está en nuestra base:
 * `pending` y `done` solo miran nuestra cola, y una partida nueva no está ni
 * registrada, así que el perfil decía "al día" mientras Riot tenía partidas
 * más nuevas. Cache corto (45 s): la respuesta cambia con cada partida.
 *
 * Usa la misma ventana que el ingest (`startTime`, 2 años) para no exigir una
 * partida que el sync nunca va a bajar. El `since` se redondea **hacia
 * adelante** al día: así la verificación nunca pide una partida del borde que
 * el ingest (ventana exacta) dejaría afuera, y la URL no cambia en cada vista
 * (si cambiara segundo a segundo, el cache de `fetch` no acertaría nunca).
 *
 * Devuelve null si el jugador no tiene partidas (o Riot responde 404).
 */
export async function getNewestMatchId(
  puuid: string,
  platform: Platform,
  deadline?: number,
): Promise<string | null> {
  if (isMockMode()) return mockMatches()[0]?.metadata.matchId ?? null;

  const since = Math.ceil(historyWindowStart() / 86_400) * 86_400;
  const ids = await riotFetch(
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1&startTime=${since}`,
    {
      cluster: clusterFor(platform),
      revalidate: 45,
      schema: MatchIdsSchema,
      deadline,
    },
  ).catch((error: unknown) => {
    // 404 = el jugador no tiene partidas. No es un error de la página.
    if (error instanceof RiotApiError && error.status === 404) return [];
    throw error;
  });

  return ids[0] ?? null;
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
    // MATCH-V5 vive en el host REGIONAL.
    { cluster: clusterFor(platform), revalidate: 120, schema: MatchIdsSchema },
  ).catch((error: unknown) => {
    // 404 = el jugador no tiene partidas. No es un error de la página.
    if (error instanceof RiotApiError && error.status === 404) return [];
    throw error;
  });

  const details = await mapLimit(ids, 4, async (matchId) => {
    try {
      return await riotFetch(`/lol/match/v5/matches/${matchId}`, {
        cluster: clusterFor(platform),
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
  deadline?: number,
): Promise<Match> {
  if (isMockMode()) {
    const found = mockMatches().find((m) => m.metadata.matchId === matchId);
    if (!found) throw new RiotApiError(404, "Partida no encontrada", matchId);
    return found;
  }
  return riotFetch(`/lol/match/v5/matches/${matchId}`, {
    cluster: clusterFor(platform),
    revalidate: 2_592_000,
    schema: MatchSchema,
    deadline,
  });
}
