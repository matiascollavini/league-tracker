/**
 * Utilidades del botón "Actualizar": progreso de la tanda, cronómetro y
 * decisión del loop. Módulo puro (sin React) para poder testearlo sin DOM.
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
 * Qué hacer después de una vuelta de `/api/sync`.
 *
 * El bug que esto evita: una vuelta que **no hizo ningún request** (429, lock
 * de otro proceso, deadline) devolvía `done: false` y los contadores locales
 * seguían en `pending = 0` / `newIds = 0`; el cliente lo tomaba como "listo" y
 * decía "Actualizado" sin haber consultado a Riot. Al recargar, el perfil
 * volvía a decir "Actualizar" (la partida nueva seguía sin cargar).
 *
 * Regla: **no se declara al día sin que Riot lo confirme** (`upToDate: true`).
 * Si la cola está drenada pero no hubo confirmación, se reintenta la
 * verificación unas pocas veces; si Riot directamente dice que hay una partida
 * nueva que no pudimos cargar (`upToDate: false`), no tiene sentido seguir.
 */
export type RoundDecision =
  | { action: "settle" }
  | { action: "retry"; notice: string }
  | { action: "stop"; notice: string }
  | { action: "continue" };

export function decideAfterRound(input: {
  /** La cola local quedó drenada (backfill + detalles). */
  done: boolean;
  /** Confirmación contra Riot: true/false verificado, null/undefined sin prueba. */
  upToDate: boolean | null | undefined;
  /** Vueltas seguidas sin hacer ningún request a Riot (429, lock, deadline). */
  stallRounds: number;
  /** Vueltas seguidas con la cola drenada pero sin confirmación de Riot. */
  unverifiedRounds: number;
}): RoundDecision {
  if (input.upToDate === true) return { action: "settle" };

  if (input.done) {
    if (input.upToDate === false) {
      // Puede ser una partida jugada mientras corría la vuelta (la próxima
      // página 0 la trae) o una que Riot ya no entrega. Un reintento alcanza
      // para distinguirlas.
      if (input.unverifiedRounds < 2) {
        return {
          action: "retry",
          notice:
            "Riot reporta una partida más nueva: reintento para cargarla.",
        };
      }
      return {
        action: "stop",
        notice:
          "Riot tiene una partida más nueva que no pudimos cargar (puede que ya no esté disponible). El perfil queda con pendientes.",
      };
    }
    if (input.unverifiedRounds >= 3) {
      return {
        action: "stop",
        notice:
          "La cola está vacía, pero Riot no nos dejó confirmar si hay partidas nuevas. Probá de nuevo en un par de minutos.",
      };
    }
    return {
      action: "retry",
      notice:
        "La cola está vacía: falta que Riot confirme que no hay partidas nuevas.",
    };
  }

  if (input.stallRounds >= 5) {
    return {
      action: "stop",
      notice:
        "Riot no nos dio turno en varias vueltas (rate limit, otro proceso o sin tiempo). No pude confirmar el estado; probá de nuevo en un par de minutos.",
    };
  }

  return { action: "continue" };
}
