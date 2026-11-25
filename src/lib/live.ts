/**
 * Partida en curso: tipos y aritmética del reloj. **Módulo puro** (cero fetch,
 * cero imports de Riot) para que lo pueda importar un client component sin
 * arrastrar `src/lib/riot/http.ts` al bundle del navegador.
 *
 * El reloj no necesita ni un request más: `gameStartTime` es un epoch en ms, así
 * que el navegador lo puede seguir contando solo. Ver `liveClockSeconds`.
 */

/** Minutos/segundos dentro de la partida, resueltos al momento del render. */
export type LiveGame = {
  gameId: number | null;
  /** `gameQueueConfigId` (420 soloQ, 440 flex, ...). */
  queueId: number | null;
  /** Epoch ms del inicio, si Riot lo mandó. */
  startedAt: number | null;
  /**
   * Segundos transcurridos según Riot en el momento del fetch. Puede faltar
   * (Riot omite los ceros). Preferir `startedAt` para dibujar el reloj.
   */
  secondsElapsed: number | null;
  /** Campeón del jugador del perfil, si lo pudimos identificar. */
  championId: number | null;
  players: LivePlayer[];
};

export type LivePlayer = {
  puuid: string | null;
  championId: number | null;
  teamId: number | null;
  /** "Nombre#TAG" si vino. Campo NO documentado: puede faltar mañana. */
  riotId: string | null;
};

export type LiveGameResult = {
  /** Puuid con el que Riot reconoció la partida (el perfil puede tener varios). */
  puuid: string;
  game: LiveGame;
};

/**
 * Diferencia tolerable entre el reloj "absoluto" (ahora - gameStartTime) y el
 * que mandó el server. Si el navegador tiene la hora mal o el payload llegó muy
 * viejo desde la caché, nos quedamos con el conteo relativo (que no puede
 * desviarse). Con caché de página de 120 s, 10 min sobra como umbral.
 */
export const CLOCK_SKEW_TOLERANCE_SECONDS = 600;

/**
 * Una partida de LoL no dura 3 horas: pasado eso el dato es viejo o está mal,
 * así que el chip se esconde en vez de contar 240:00.
 */
export const MAX_LIVE_SECONDS = 3 * 60 * 60;

/**
 * Reloj de la partida en segundos, versión server (una sola foto).
 *
 * Preferimos `gameStartTime` (exacto al momento del render) sobre `gameLength`,
 * que envejece con la caché del fetch. `now` es inyectable para los tests.
 */
export function elapsedSeconds(game: LiveGame, now = Date.now()): number | null {
  if (game.startedAt !== null) {
    return Math.max(0, Math.floor((now - game.startedAt) / 1_000));
  }
  return game.secondsElapsed;
}

/**
 * Reloj en el navegador, recalculado en cada tick sin pedirle nada a nadie.
 *
 * - `startedAt` + `now`: absoluto y exacto. Se usa si no se aleja demasiado del
 *   valor del server (ver `CLOCK_SKEW_TOLERANCE_SECONDS`), porque también
 *   corrige el caso "el HTML llegó de la caché 90 s tarde".
 * - Si no hay `startedAt` (Riot lo omite en partidas recién creadas) o el
 *   navegador tiene la hora mal: `base` (valor del server) + tiempo transcurrido
 *   desde que montamos. Reloj monotónico, inmune a la hora del sistema.
 *
 * `null` si no hay forma de saberlo (ni startedAt ni base): la UI muestra el
 * chip sin reloj en vez de inventar un minuto.
 */
export function liveClockSeconds(input: {
  /** Epoch ms del inicio de la partida, o null. */
  startedAt: number | null;
  /** Segundos que calculó el server al renderizar (foto de la partida). */
  base: number | null;
  /** `Date.now()` cuando el componente se montó en el navegador. */
  mountedAt: number;
  /** `Date.now()` del tick actual. */
  now: number;
}): number | null {
  const { startedAt, base, mountedAt, now } = input;

  if (startedAt !== null) {
    const absolute = Math.floor((now - startedAt) / 1_000);
    if (base === null) return Math.max(0, absolute);
    if (Math.abs(absolute - base) <= CLOCK_SKEW_TOLERANCE_SECONDS) {
      return Math.max(0, absolute);
    }
  }

  if (base === null) return null;
  return base + Math.max(0, Math.floor((now - mountedAt) / 1_000));
}

/** 754 -> "12:34". null/negativo -> null (la UI muestra "en partida"). */
export function formatGameClock(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
