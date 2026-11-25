/**
 * Aritmética del progreso del botón "Actualizar ahora". Módulo puro (sin React)
 * para poder testearla sin DOM.
 */

/** 42_000 -> "0:42", 3_600_000 -> "60:00". */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1_000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, "0")}`
    : `${seconds} s`;
}

export type BatchProgress = {
  /** Partidas analizadas desde que se apretó el botón. */
  analyzed: number;
  /** Pendientes ahora mismo (puede crecer si Riot devuelve más IDs en el camino). */
  pending: number;
  /** Denominador de la tanda, nunca menor que lo analizado. */
  total: number;
  /** 0..100. */
  pct: number;
};

/**
 * Progreso de la tanda.
 *
 * Se mide contra el momento en que el usuario apretó el botón y no contra el
 * total de la cuenta: si el jugador ya tenía 1.000 partidas y Riot trajo 5
 * nuevas, el contador arranca en "0 de 5" en vez del inútil "1.000 de 1.005".
 * Si aparecen IDs nuevos a mitad de camino, el denominador crece para que el
 * porcentaje nunca mienta ni pase de 100.
 */
export function batchProgress(input: {
  /** Analizadas en la base ahora. */
  detailed: number;
  /** Conocidas en la base ahora. */
  known: number;
  /** Analizadas cuando empezó la tanda. */
  baselineDetailed: number;
  /** Pendientes cuando empezó la tanda. */
  batchTotal: number;
}): BatchProgress {
  const { detailed, known, baselineDetailed, batchTotal } = input;

  const analyzed = Math.max(0, detailed - baselineDetailed);
  const pending = Math.max(0, known - detailed);
  const total = Math.max(batchTotal, analyzed + pending);
  const pct = total > 0 ? Math.min(100, Math.round((analyzed / total) * 100)) : 0;

  return { analyzed, pending, total, pct };
}

/**
 * ¿Ya no queda nada que traer después de esta vuelta?
 *
 * Tres formas de terminar:
 *  - `done`: el server ya recorrió todo el historial y no quedan pendientes.
 *  - Sin IDs nuevos y sin detalles pendientes: la partida más nueva de Riot ya
 *    está cargada, así que seguir es gastar cupo en nada.
 *
 * Ojo: NO alcanza con `pending === 0`. Una partida jugada después del último
 * sync no está ni en nuestra cola, así que el contador de pendientes puede dar
 * cero mientras Riot tiene partidas nuevas (`newIds` viene de comparar el
 * `known` de la vuelta anterior con el de ésta).
 */
export function isSettledAfterRound(input: {
  done: boolean;
  pending: number;
  newIds: number;
}): boolean {
  if (input.done) return true;
  return input.pending === 0 && input.newIds === 0;
}
