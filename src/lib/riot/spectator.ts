import type { Platform } from "./config";
import { isMockMode, RiotApiError, riotFetch } from "./http";
import { ActiveGameSchema, type ActiveGame } from "./types";
import type { LiveGame, LiveGameResult, LivePlayer } from "@/lib/live";

/**
 * SPECTATOR-V5: ¿el jugador está en una partida AHORA?
 *
 *   GET https://{platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/{puuid}
 *
 * Reglas que implementa (ver docs/API-LOL.txt §7.9):
 *  - Host de PLATAFORMA (no regional): con el cluster devuelve 403.
 *  - El 404 es el caso NORMAL ("no está jugando"), no un error.
 *  - Caché corta (`revalidate: 30`) y tag `spectator`: es el único dato del
 *    sitio que no puede venir del ingest; sin TTL corto el badge queda pegado.
 *    El botón "Actualizar" invalida el tag (ADR-020) y el chip hace un poll
 *    liviano a /api/en-vivo para detectar el final de la partida.
 *  - Este endpoint solo cubre LoL. Un jugador en TFT da 404 acá: TFT tiene su
 *    propio `spectator-tft-v5` (`.../spectator/tft/v5/active-games/by-puuid/{puuid}`).
 *  - Nunca se parsea el body del error: se ramifica por status code.
 *
 * El reloj del chip NO se actualiza con requests: `gameStartTime` es un epoch,
 * así que el navegador lo sigue contando solo (`liveClockSeconds` en
 * `src/lib/live.ts`). Acá se pide la partida una vez por ventana de caché; el
 * poll del chip reusa esa misma caché (no multiplica requests por espectador).
 *
 * Los tipos y la aritmética del reloj viven en `@/lib/live` (módulo puro) para
 * que el client component del chip no arrastre este archivo al bundle.
 */

export type { LiveGame, LiveGameResult, LivePlayer } from "@/lib/live";
export { elapsedSeconds, formatGameClock } from "@/lib/live";

/**
 * Cuántos puuids se consultan. Riot reasigna puuids, así que el perfil puede
 * tener un par; cada uno extra es un request a Riot, por eso el tope.
 */
const MAX_PUUID_CHECKS = 2;

/** Caché de Next para este endpoint: corta a propósito (ver cabecera). */
const REVALIDATE_SECONDS = 30;

/**
 * Presupuesto del chequeo. Si el token bucket está seco (100/2min), riotFetch
 * dormiría hasta 2 minutos y el perfil no puede esperar eso por un chip: se
 * corta con RiotDeadlineError y `findActiveGame` devuelve null.
 */
const BADGE_BUDGET_MS = 3_000;

/**
 * Payload crudo -> vista de la UI. Puro: se testea sin red.
 * `puuids` es el conjunto del perfil; sirve para saber cuál participante es el
 * jugador (el roster trae a los 10).
 */
export function toLiveGame(
  raw: ActiveGame,
  puuids: readonly string[],
): LiveGame {
  const players: LivePlayer[] = raw.participants.map((participant) => ({
    puuid: participant.puuid ?? null,
    championId: participant.championId ?? null,
    teamId: participant.teamId ?? null,
    riotId: participant.riotId ?? null,
  }));

  const me = players.find(
    (player) => player.puuid !== null && puuids.includes(player.puuid),
  );

  return {
    gameId: raw.gameId ?? null,
    queueId: raw.gameQueueConfigId ?? null,
    startedAt: raw.gameStartTime ?? null,
    secondsElapsed: raw.gameLength ?? null,
    championId: me?.championId ?? null,
    players,
  };
}

/**
 * Un request a spectator. Devuelve `null` si el jugador no está en partida
 * (404). Cualquier otro fallo se propaga: acá somos honestos, el que decide
 * degradar en silencio es `findActiveGame`.
 */
export async function getActiveGame(
  puuid: string,
  platform: Platform,
  deadline?: number,
): Promise<ActiveGame | null> {
  if (isMockMode()) return null;
  try {
    return await riotFetch(
      `/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`,
      // Host de PLATAFORMA: con el cluster, Riot contesta 403.
      {
        platform,
        revalidate: REVALIDATE_SECONDS,
        // Lo invalida /api/sync cuando el usuario aprieta "Actualizar": si la
        // partida terminó, el refresh no puede seguir mostrando el chip viejo.
        tags: ["spectator"],
        schema: ActiveGameSchema,
        deadline,
      },
    );
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Busca la partida en curso entre los puuids del perfil.
 *
 * Nunca tira: el badge es opcional y el perfil no se puede romper porque Riot
 * esté limitando o la key esté vencida. Al primer error deja de consultar para
 * no quemar cupo.
 */
export async function findActiveGame(
  puuids: readonly string[],
  platform: Platform,
): Promise<LiveGameResult | null> {
  if (isMockMode()) return null;

  // Un solo presupuesto para toda la búsqueda: el chip no cuelga el perfil.
  const deadline = Date.now() + BADGE_BUDGET_MS;

  for (const puuid of puuids.slice(0, MAX_PUUID_CHECKS)) {
    try {
      const raw = await getActiveGame(puuid, platform, deadline);
      if (raw) return { puuid, game: toLiveGame(raw, puuids) };
    } catch {
      return null;
    }
  }
  return null;
}
