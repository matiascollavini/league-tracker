"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  batchProgress,
  decideAfterRound,
  formatElapsed,
} from "@/lib/sync-progress";
import type { Platform } from "@/lib/riot/config";

type Props = {
  platform: Platform;
  gameName: string;
  tagLine: string;
  /** Progreso que ya conoce el server (para saber si la tanda es larga). */
  known: number;
  detailed: number;
  /**
   * El perfil está al día según el server: nada pendiente, backfill recorrido y
   * la partida más nueva de Riot ya está en la base. Decide qué dice el botón.
   */
  upToDate: boolean;
  /** El server no pudo comparar contra Riot (429/5xx): `upToDate` es false por
   * precaución, no porque haya partidas nuevas. Se explica en la UI. */
  unverified: boolean;
};

/**
 * Respuesta de /api/sync. Todo opcional a propósito: un 429 o un error vuelve
 * SIN progreso, y el botón tiene que poder contarlo igual.
 */
type SyncPayload = {
  known?: number;
  detailed?: number;
  done?: boolean;
  /** Confirmación del server contra Riot (`null` = no se pudo verificar). */
  upToDate?: boolean | null;
  requests?: number;
  retryAfterMs?: number;
  error?: string;
  /** Qué estaba haciendo el server cuando cortó la vuelta. */
  phase?: "ids" | "details" | "done" | "locked" | "throttled";
  skipped?: boolean;
  /** Si otro proceso tiene el lock: cuánto le queda (ms). */
  lockForMs?: number;
  /** Partidas que Riot ya no tiene y se descartaron en esta vuelta. */
  unavailable?: number;
};

type SyncPhase = NonNullable<SyncPayload["phase"]>;

type ProgressState = {
  known: number;
  detailed: number;
  /** Analizadas cuando empezó la tanda: base del "0 de N". */
  baselineDetailed: number;
  /** Pendientes al empezar; el total crece si aparecen IDs nuevos. */
  batchTotal: number;
  phase: SyncPhase | null;
};

type State = {
  running: boolean;
  /** Error que corta la carga (rojo). */
  error: string | null;
  /** Aviso que NO corta nada: lock, 429, tope de vueltas (gris). */
  notice: string | null;
  /** Partidas que Riot ya no tiene y se sacaron de la cola. */
  unavailable: number;
  /** Progreso de la tanda en curso; null cuando no corre. */
  progress: ProgressState | null;
};

const PHASE_LABEL: Record<SyncPhase, string> = {
  ids: "buscando partidas",
  details: "bajando detalles",
  done: "verificando con Riot",
  locked: "esperando a otro proceso",
  throttled: "rate limit de Riot",
};

/** Debajo de esto no vale la pena una barra: es una tanda de segundos. */
const PROGRESS_THRESHOLD = 50;

/** Tope de vueltas: 60 × 30 requests = 1.800, más que el máximo real. */
const MAX_ROUNDS = 60;

/** Sleep cancelable: al desmontar la página despierta al toque. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

/**
 * Botón de estado + acción del perfil, al lado del nombre.
 *
 * Dos estados, como el de dpm.lol: **"Actualizado"** (no hay nada que traer) y
 * **"Actualizar"** (hay partidas nuevas en Riot o detalles pendientes). Al
 * apretarlo pide tandas a `/api/sync` —endpoint incremental y resumible— hasta
 * que no queda nada, y ahí **refresca la página sola** para que el perfil, los
 * agregados y las últimas partidas se redibujen con lo nuevo.
 *
 * Mientras corre se muestra el botón con "Actualizando…". Si la tanda supera
 * las 50 partidas pendientes, además aparece una barra y el estado actual del
 * script (buscando partidas, bajando detalles, rate limit, lock...) para que el
 * visitante sepa cuánto falta. En tandas cortas solo se ve el botón. Los avisos
 * (rate limit, lock, error) aparecen debajo; el avance queda guardado igual.
 *
 * La decisión de qué decir no sale de nuestra cola: una partida jugada después
 * del último sync no está ni registrada, así que el server compara contra el
 * matchId más nuevo de Riot y manda `upToDate`.
 */
export function RefreshButton({
  platform,
  gameName,
  tagLine,
  known,
  detailed,
  upToDate,
  unverified,
}: Props) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Mientras `router.refresh()` trae los props frescos, el botón queda en
   * "Actualizando…" y no alcanza a parpadear con el label viejo.
   */
  const [isRefreshing, startTransition] = useTransition();
  const [state, setState] = useState<State>({
    running: false,
    error: null,
    notice: null,
    unavailable: 0,
    progress: null,
  });

  // Si desmontan la página, cortamos el request en curso.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();

    let notice: string | null = null;
    let unavailable = 0;
    // Progreso de esta tanda: se mide desde los números del render actual.
    let detailedNow = detailed;
    let knownNow = known;
    const baselineDetailed = detailed;
    const batchTotal = Math.max(0, known - detailed);
    let phase: SyncPhase | null = null;
    // Vueltas seguidas sin ningún request (429/lock/deadline) y vueltas con la
    // cola drenada pero sin confirmación de Riot. Deciden cuándo rendirse.
    let stallRounds = 0;
    let unverifiedRounds = 0;

    const publish = (nextNotice: string | null) =>
      setState({
        running: true,
        error: null,
        notice: nextNotice,
        unavailable,
        progress: {
          known: knownNow,
          detailed: detailedNow,
          baselineDetailed,
          batchTotal,
          phase,
        },
      });

    const finish = (extra: Partial<State>) =>
      setState({
        running: false,
        error: null,
        notice: null,
        unavailable,
        progress: null,
        ...extra,
      });

    publish(null);

    for (let round = 1; round <= MAX_ROUNDS; round += 1) {
      let payload: SyncPayload;
      let status = 0;

      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, gameName, tagLine }),
          signal: controller.signal,
        });
        status = res.status;
        payload = (await res.json()) as SyncPayload;
      } catch {
        if (controller.signal.aborted) {
          finish({
            notice:
              "Se interrumpió la carga. El avance quedó guardado: podés retomarla cuando quieras.",
          });
          return;
        }
        finish({
          error: `Se cortó la conexión con el servidor a los ${formatElapsed(
            Date.now() - startedAt,
          )}. El avance quedó guardado.`,
        });
        return;
      }

      if (typeof payload.detailed === "number") detailedNow = payload.detailed;
      if (typeof payload.known === "number") knownNow = payload.known;
      if (payload.phase) phase = payload.phase;
      // Un 429 no trae phase: el carril es el rate limit.
      if (status === 429 && !payload.phase) phase = "throttled";

      const roundRequests =
        typeof payload.requests === "number" ? payload.requests : 0;
      stallRounds = roundRequests > 0 ? 0 : stallRounds + 1;
      if (payload.upToDate === true) unverifiedRounds = 0;
      else if (payload.done === true) unverifiedRounds += 1;
      else unverifiedRounds = 0;
      if (typeof payload.unavailable === "number") {
        unavailable += payload.unavailable;
      }

      // Cualquier respuesta que no sea 200 ni el 429 (que se reintenta).
      if (status !== 200 && status !== 429) {
        finish({
          error: payload.error ?? `El servidor respondió ${status}.`,
        });
        return;
      }

      // La condición para decir "Actualizado" es la del server, no nuestra
      // cola: una vuelta sin requests (429/lock) no prueba nada.
      const retryMs = Math.min(
        30_000,
        typeof payload.retryAfterMs === "number" ? payload.retryAfterMs : 600,
      );
      const decision = decideAfterRound({
        done: payload.done === true,
        upToDate: payload.upToDate,
        stallRounds,
        unverifiedRounds,
      });

      if (decision.action === "settle") {
        // Riot confirmó: se redibuja el perfil y el botón queda "Actualizado".
        finish({});
        startTransition(() => router.refresh());
        return;
      }

      if (decision.action === "stop") {
        // Se corta sin mentir: el label lo decide el server al refrescar.
        finish({ notice: decision.notice });
        startTransition(() => router.refresh());
        return;
      }

      if (decision.action === "retry") {
        notice = decision.notice;
        publish(notice);
        // La verificación contra Riot es 1 request: si falló por rate limit,
        // vale la pena esperar un poco más que el retry normal de la cola.
        await sleep(Math.max(retryMs, 5_000), controller.signal);
        continue;
      }

      // Explicamos por qué no avanzó, en vez de reintentar en silencio.
      if (payload.error) {
        notice = `${payload.error} Reintento en ${formatElapsed(retryMs)}.`;
      } else if (payload.phase === "throttled") {
        notice = `Riot nos está frenando (rate limit): espero ${formatElapsed(retryMs)} y sigo.`;
      } else if (payload.skipped) {
        const left =
          payload.lockForMs && payload.lockForMs > 0
            ? ` El lock vence en ~${formatElapsed(payload.lockForMs)}.`
            : "";
        notice =
          "Otro proceso está sincronizando esta cuenta sobre la misma base: el worker, otra pestaña, o un segundo server (dev y `next start` a la vez)." +
          `${left} Espero y reintento.`;
      } else {
        notice = null;
      }

      publish(notice);
      await sleep(retryMs, controller.signal);
    }

    if (controller.signal.aborted) {
      finish({
        notice:
          "Se interrumpió la carga. El avance quedó guardado: podés retomarla cuando quieras.",
      });
      return;
    }

    finish({
      notice: `Se cortó a las ${MAX_ROUNDS} vueltas (${formatElapsed(
        Date.now() - startedAt,
      )}) sin terminar. El avance quedó guardado: volvé a tocar el botón para seguir.`,
    });
  }

  const { running, error, notice, unavailable, progress: progressState } = state;
  // Una sola fuente de verdad: el server. El cliente no puede declarar
  // "Actualizado" por su cuenta (ver ADR-018).
  const isUpToDate = upToDate;
  const busy = running || isRefreshing;
  const progress = progressState
    ? batchProgress({
        detailed: progressState.detailed,
        known: progressState.known,
        baselineDetailed: progressState.baselineDetailed,
        batchTotal: progressState.batchTotal,
      })
    : null;
  // La barra solo aparece en tandas largas: el visitante necesita saber cuánto
  // falta, pero en una actualización de 3 partidas sería ruido.
  const showProgress =
    running && progress !== null && progress.total > PROGRESS_THRESHOLD;
  const phaseLabel = progressState?.phase
    ? PHASE_LABEL[progressState.phase]
    : "buscando partidas";

  return (
    <div className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:items-end">
      <Button
        type="button"
        size="sm"
        variant={isUpToDate && !busy ? "ghost" : "primary"}
        onClick={run}
        disabled={busy}
        aria-busy={busy}
        title={
          isUpToDate
            ? "El perfil está al día: la partida más nueva de Riot ya está cargada"
            : unverified && !running
              ? "No pude verificar con Riot si hay partidas nuevas (rate limit o error). Probá de nuevo en un momento"
              : "Traer las partidas que faltan de esta cuenta"
        }
        className={cn(isUpToDate && !busy && "text-win hover:text-win")}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : isUpToDate ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <RefreshCw className="size-3.5" aria-hidden />
        )}
        {busy ? "Actualizando…" : isUpToDate ? "Actualizado" : "Actualizar"}
      </Button>

      {showProgress && progress ? (
        <div className="w-full min-w-[220px] space-y-1 sm:w-[280px]">
          <div className="h-1.5 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.max(
                  progress.pct,
                  progress.analyzed > 0 ? 2 : 0,
                )}%`,
              }}
              role="progressbar"
              aria-valuenow={progress.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Avance del análisis de partidas"
            />
          </div>
          <p className="tabular text-[10px] leading-snug text-muted sm:text-right">
            {progress.analyzed} de {progress.total} analizadas · {progress.pct}%
            {progress.pending > 0 ? ` · faltan ${progress.pending}` : ""}
            {` · ${phaseLabel}`}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="max-w-[280px] text-[10px] leading-snug text-loss">{error}</p>
      ) : null}

      {notice && !error ? (
        <p className="max-w-[280px] text-[10px] leading-snug text-muted">
          {notice}
        </p>
      ) : null}

      {!busy && !error && !notice && !isUpToDate && unverified ? (
        <p className="max-w-[280px] text-[10px] leading-snug text-muted">
          No pude verificar con Riot si hay partidas nuevas (rate limit o
          error). El perfil puede estar al día igual; probá de nuevo en un
          momento.
        </p>
      ) : null}

      {!busy && !error && !notice && unavailable > 0 ? (
        <p className="text-[10px] leading-snug text-muted">
          {unavailable === 1
            ? "Se descartó 1 partida que Riot ya no tiene."
            : `Se descartaron ${unavailable} partidas que Riot ya no tiene.`}
        </p>
      ) : null}
    </div>
  );
}
