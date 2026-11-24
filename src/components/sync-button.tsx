"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/riot/config";

type Props = {
  platform: Platform;
  gameName: string;
  tagLine: string;
  /** Progreso inicial que ya conoce el servidor. */
  known: number;
  detailed: number;
};

/**
 * Respuesta de /api/sync. Todo opcional a propósito: un 429 o un error vuelve
 * SIN progreso, y el loader tiene que poder contarlo igual.
 */
type SyncPayload = {
  ok?: boolean;
  detailed?: number;
  known?: number;
  done?: boolean;
  requests?: number;
  retryAfterMs?: number;
  error?: string;
  /** Qué estaba haciendo el server cuando cortó la vuelta. */
  phase?: "ids" | "details" | "done" | "locked" | "throttled";
  elapsedMs?: number;
  skipped?: boolean;
  /** Si otro proceso tiene el lock: cuánto le queda (ms). */
  lockForMs?: number;
  /** Partidas que Riot ya no tiene y se descartaron en esta vuelta. */
  unavailable?: number;
};

const PHASE_LABEL: Record<string, string> = {
  ids: "descubriendo partidas",
  details: "bajando detalles",
  locked: "esperando a otro proceso",
  throttled: "rate limit de Riot",
};

type State = {
  running: boolean;
  detailed: number;
  known: number;
  /** Error que corta la carga (rojo). */
  error: string | null;
  /** Aviso que NO corta nada: lock, 429, tope de vueltas (gris). */
  notice: string | null;
  done: boolean;
  round: number;
  requests: number;
  /** Qué estaba haciendo el server en la última vuelta. */
  phase: "ids" | "details" | "done" | "locked" | "throttled" | null;
  /** Partidas que Riot ya no tiene y se sacaron de la cola. */
  unavailable: number;
  startedAt: number | null;
  /** Último momento en que el contador de partidas se movió. */
  lastProgressAt: number | null;
  /** Reloj del tick: hace correr el cronómetro mientras esperamos al server. */
  now: number;
};

/**
 * Una vuelta del servidor (40 requests) tarda entre 18 y 60 s porque Riot
 * permite 100 requests cada 2 minutos con dev key. El cronómetro de la línea
 * de progreso muestra que está vivo; este umbral es para lo anormal: pasado
 * bastante más que una vuelta normal, avisamos en vez de girar en silencio.
 */
const STALL_MS = 90_000;
/** Tope de vueltas: 60 × 40 requests = 2.400, más que el máximo real. */
const MAX_ROUNDS = 60;

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1_000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, "0")}`
    : `${seconds} s`;
}

/** Sleep cancelable: si el usuario aprieta "Detener", despierta al toque. */
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
 * Botón para completar el historial. Va pidiendo tandas al servidor y muestra
 * el progreso, el tiempo, la fase y por qué se está esperando; al terminar
 * refresca la página.
 */
export function SyncButton({
  platform,
  gameName,
  tagLine,
  known,
  detailed,
}: Props) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<State>({
    running: false,
    detailed,
    known,
    error: null,
    notice: null,
    done: false,
    round: 0,
    requests: 0,
    phase: null,
    unavailable: 0,
    startedAt: null,
    lastProgressAt: null,
    now: 0,
  });

  // Cronómetro: un tick por segundo mientras corre, así se ve que está vivo
  // aunque una vuelta tarde un minuto en contestar.
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      setState((prev) => (prev.running ? { ...prev, now: Date.now() } : prev));
    }, 1_000);
    return () => clearInterval(id);
  }, [state.running]);

  // Si desmontan la página, cortamos el request en curso.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();

    // Copias locales: el loop no depende de `state` (que quedaría viejo).
    let currentDetailed = state.detailed;
    let currentKnown = state.known;
    let requests = 0;
    let lastProgressAt = startedAt;
    let notice: string | null = null;
    let roundsDone = 0;
    let phase: State["phase"] = null;
    let unavailable = 0;

    const publish = (extra: Partial<State> = {}) =>
      setState({
        running: true,
        detailed: currentDetailed,
        known: currentKnown,
        error: null,
        notice,
        done: false,
        round: roundsDone,
        requests,
        phase,
        unavailable,
        startedAt,
        lastProgressAt,
        now: Date.now(),
        ...extra,
      });

    const finish = (extra: Partial<State>) =>
      setState((prev) => ({
        ...prev,
        running: false,
        error: null,
        notice: null,
        done: false,
        detailed: currentDetailed,
        known: currentKnown,
        round: roundsDone,
        requests,
        phase,
        unavailable,
        startedAt,
        lastProgressAt,
        now: Date.now(),
        ...extra,
      }));

    publish();

    for (let round = 1; round <= MAX_ROUNDS; round += 1) {
      roundsDone = round;

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
              "Detuviste la carga. El avance quedó guardado: podés retomarla cuando quieras.",
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

      requests += typeof payload.requests === "number" ? payload.requests : 0;

      if (typeof payload.detailed === "number") {
        if (payload.detailed > currentDetailed) lastProgressAt = Date.now();
        currentDetailed = payload.detailed;
      }
      if (typeof payload.known === "number") currentKnown = payload.known;
      if (payload.phase) phase = payload.phase;
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

      if (payload.done) {
        publish({ running: false, done: true, notice: null });
        router.refresh();
        return;
      }

      const retryMs = Math.min(
        30_000,
        typeof payload.retryAfterMs === "number" ? payload.retryAfterMs : 600,
      );

      // Explicamos por qué no avanzó, en vez de reintentar en silencio.
      if (payload.error) {
        notice = `${payload.error} Reintento en ${formatElapsed(retryMs)}.`;
      } else if (payload.phase === "throttled") {
        notice = `Riot nos está frenando (rate limit): espero ${formatElapsed(retryMs)} y sigo.`;
      } else if (payload.skipped || (payload.requests ?? 0) === 0) {
        const left =
          payload.lockForMs && payload.lockForMs > 0
            ? ` El lock vence en ~${formatElapsed(payload.lockForMs)}.`
            : "";
        notice = `Otro proceso (el worker u otra pestaña) está sincronizando esta cuenta.${left} Espero y reintento.`;
      } else {
        notice = null;
      }

      publish();
      await sleep(retryMs, controller.signal);
    }

    if (controller.signal.aborted) {
      finish({
        notice:
          "Detuviste la carga. El avance quedó guardado: podés retomarla cuando quieras.",
      });
      return;
    }

    finish({
      notice: `Se cortó a las ${MAX_ROUNDS} vueltas (${formatElapsed(
        Date.now() - startedAt,
      )}) sin terminar. El avance quedó guardado: volvé a tocar el botón para seguir.`,
    });
  }

  function stop() {
    abortRef.current?.abort();
  }

  const { running, done, error, notice, round, requests, startedAt } = state;
  const pct =
    state.known > 0
      ? Math.min(100, Math.round((state.detailed / state.known) * 100))
      : 0;
  const elapsedMs = startedAt === null ? 0 : state.now - startedAt;
  const sinceProgressMs =
    state.lastProgressAt === null ? 0 : state.now - state.lastProgressAt;
  const stalled = running && !error && sinceProgressMs >= STALL_MS;
  const phaseLabel = state.phase ? PHASE_LABEL[state.phase] : null;

  if (done) {
    return (
      <div className="flex items-center gap-2 text-xs text-win">
        <CheckCircle2 className="size-4" aria-hidden />
        Historial completo: {state.detailed} partidas analizadas.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={run}
          disabled={running}
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {running ? "Analizando…" : "Cargar todo el historial"}
        </Button>

        {running ? (
          <Button type="button" size="sm" variant="ghost" onClick={stop}>
            <Square className="size-3" aria-hidden />
            Detener
          </Button>
        ) : null}

        <span className="tabular text-[11px] text-muted" aria-live="polite">
          {state.detailed} de {state.known} partidas
          {state.known > 0 ? ` · ${pct}%` : ""}
          {running
            ? ` · ${formatElapsed(elapsedMs)} · vuelta ${round}${phaseLabel ? ` · ${phaseLabel}` : ""}${requests > 0 ? ` · ${requests} req` : ""}`
            : ""}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-gold-500 transition-all"
          style={{ width: `${Math.max(2, pct)}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="space-y-1 text-[11px] leading-relaxed">
        {error ? <p className="text-loss">{error}</p> : null}

        {stalled ? (
          <p className="flex items-start gap-1.5 text-gold-300">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
            <span>
              Sin avance hace {formatElapsed(sinceProgressMs)}. Una vuelta normal
              tarda hasta ~60 s, así que esto ya es más de lo esperado: puede ser
              el rate limit de Riot (100 requests cada 2 minutos con dev key) o un
              request colgado. Sigue esperando o apretá Detener; el avance queda
              guardado igual.
            </span>
          </p>
        ) : null}

        {notice && !error ? <p className="text-muted">{notice}</p> : null}

        {!running && !error && !notice && state.unavailable > 0 ? (
          <p className="text-muted">
            {state.unavailable === 1
              ? "Se descartó 1 partida que Riot ya no tiene."
              : `Se descartaron ${state.unavailable} partidas que Riot ya no tiene.`}
          </p>
        ) : null}

        {!running && !error && !notice ? (
          <p className="text-muted">
            Se puede cerrar la página: el avance queda guardado y se retoma
            donde quedó.
          </p>
        ) : null}
      </div>
    </div>
  );
}
