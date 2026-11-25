import type { Platform } from "@/lib/riot/config";
import { getNewestMatchId } from "@/lib/riot/matches";
import { isMatchLoadedForPuuids } from "@/lib/db/matches";

/**
 * ¿Riot tiene una partida más nueva que la que tenemos cargada?
 *
 * Es la única pregunta que no se puede contestar mirando nuestra cola: una
 * partida jugada después del último sync **no está ni registrada**, así que
 * `known`/`detailed` no la ven. Se consulta con 1 request (solo IDs, cache
 * 45 s) y se compara contra el link del jugador, no contra la tabla `matches`
 * (la partida puede estar guardada por otra persona).
 *
 * Lo usan los dos caminos que deciden el label del botón:
 *  - `loadProfile` (render del perfil);
 *  - `syncPuuid` (respuesta de `/api/sync`).
 * Si cada uno usara su propia definición, el botón diría "Actualizado" y al
 * recargar "Actualizar" (o al revés).
 */
export type NewestMatchStatus = {
  /**
   * true  -> la partida más nueva de Riot (si existe) ya está cargada.
   * false -> Riot tiene una partida que este jugador no tiene cargada.
   * null  -> no se pudo consultar (429/5xx/timeout): no hay prueba.
   */
  upToDate: boolean | null;
  /** El matchId más nuevo que devolvió Riot, si se pudo leer. */
  newestMatchId: string | null;
};

export async function checkNewestMatch(
  puuids: readonly string[],
  platform: Platform,
  options: { deadline?: number } = {},
): Promise<NewestMatchStatus> {
  // El primero es el puuid canónico/resuelto: a ese se le pregunta por las
  // partidas nuevas. El conjunto completo se usa para ver si ya la tenemos.
  const puuid = puuids[0];
  if (!puuid) return { upToDate: null, newestMatchId: null };

  try {
    const newest = await getNewestMatchId(puuid, platform, options.deadline);
    if (newest === null) {
      return { upToDate: true, newestMatchId: null };
    }
    return {
      upToDate: await isMatchLoadedForPuuids(puuids, newest),
      newestMatchId: newest,
    };
  } catch {
    // 429, 5xx, timeout o deadline: no podemos afirmar nada.
    return { upToDate: null, newestMatchId: null };
  }
}
