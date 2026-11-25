"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2, RefreshCw, Square } from "lucide-react";
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
  /** Progreso que ya conoce el servidor. */
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
  ok?: boolean;
  detailed?: number;
  known?: number;
  done?: boolean;
  /** Confirmación del server contra Riot (`null` = no se pudo verificar). */
  upToDate?: boolean | null;
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
  ids: "buscando partidas",
  details: "bajando detalles",
  locked: "esperando a otro proceso",
  throttled: "rate limit de Riot",
};

type State = {
  running: boolean;
  /**
   * Números que reportó el server en ESTA tanda, con los props que había cuando
   * se guardaron. En render se usan solo si los props siguen siendo los mismos:
   * así, cuando `router.refresh()` trae datos frescos, se descartan solos (sin
   * setState en un effect).
   */
  batch: {
    known: number;
    detailed: number;
    propsKnown: number;
    propsDetailed: number;
  } | null;
  /** Error que corta la carga (rojo). */
  error: string | null;
  /** Aviso que NO corta nada: lock, 429, tope de vueltas (gris). */
  notice: string | null;
  round: number;
  requests: number;
  phase: "ids" | "details" | "done" | "locked" | "throttled" | null;
  /** Partidas que Riot ya no tiene y se sacaron de la cola. */
  unavailable: number;
  /** Analizadas cuando empezó la tanda (base del "0 de N"). */
  baselineDetailed: number;
  /** Pendientes al empezar la tanda (el denominador crece si aparecen más). */
  batchTotal: number;
  startedAt: number | null;
  /** Último momento en que el contador de partidas se movió. */
  lastProgressAt: number | null;
  /** Reloj del tick: hace correr el cronómetro mientras esperamos al server. */
  now: number;
};

/**
 * Una vuelta del servidor (30 requests) tarda entre 18 y 60 s porque Riot
 * permite 100 requests cada 2 minutos con dev key. El cronómetro muestra que
 * está vivo; este umbral es para lo anormal.
 */
const STALL_MS = 90_000;
/** Tope de vueltas: 60 × 30 requests = 1.800, más que el máximo real. */
const MAX_ROUNDS = 60;

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
 * Botón de estado + acción del perfil, al lado del nombre.
 *
 * Dos estados, como el de dpm.lol: **"Actualizado"** (no hay nada que traer) y
 * **"Actualizar"** (hay partidas nuevas en Riot o detalles pendientes). Al
 * apretarlo pide tandas a `/api/sync` —endpoint incremental y resumible— hasta
 * que no queda nada, y ahí **refresca la página sola** para que el perfil, los
 * agregados y las últimas partidas se redibujen con lo nuevo.
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
    batch: null,
    error: null,
    notice: null,
    round: 0,
    requests: 0,
    phase: null,
    unavailable: 0,
    // Lo que ya está analizado es la base de cero: al abrir la página el
    // contador dice "0 de N pendientes", no "1.000 de 1.005".
    baselineDetailed: detailed,
    batchTotal: Math.max(0, known - detailed),
    startedAt: null,
    lastProgressAt: null,
    now: 0,
  });

  // Números vigentes: los de la tanda en curso o, si ya no aplican, los props
  // que mandó el server (después de `router.refresh()` son los frescos).
  const usable =
    state.batch !== null &&
    state.batch.propsKnown === known &&
    state.batch.propsDetailed === detailed
      ? state.batch
      : null;
  const currentKnown = usable?.known ?? known;
  const currentDetailed = usable?.detailed ?? detailed;

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
    let detailedNow = currentDetailed;
    let knownNow = currentKnown;
    // La tanda se mide desde acá: estos son los pendientes que el usuario ve
    // como "0 de N" al apretar el botón.
    const baseline = currentDetailed;
    let batchTotal = Math.max(0, currentKnown - currentDetailed);
    let requests = 0;
    let lastProgressAt = startedAt;
    let notice: string | null = null;
    let roundsDone = 0;
    let phase: State["phase"] = null;
    let unavailable = 0;
    // Vueltas seguidas sin ningún request (429/lock/deadline) y vueltas con la
    // cola drenada pero sin confirmación de Riot. Deciden cuándo rendirse.
    let stallRounds = 0;
    let unverifiedRounds = 0;

    const snapshot = () => ({
      batch: {
        known: knownNow,
        detailed: detailedNow,
        propsKnown: known,
        propsDetailed: detailed,
      },
      round: roundsDone,
      requests,
      phase,
      unavailable,
      baselineDetailed: baseline,
      batchTotal,
      startedAt,
      lastProgressAt,
      now: Date.now(),
    });

    const publish = (extra: Partial<State> = {}) =>
      setState({
        ...snapshot(),
        running: true,
        error: null,
        notice,
        ...extra,
      });

    const finish = (extra: Partial<State>) =>
      setState((prev) => ({
        ...prev,
        ...snapshot(),
        running: false,
        error: null,
        notice: null,
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

      const roundRequests =
        typeof payload.requests === "number" ? payload.requests : 0;
      requests += roundRequests;
      stallRounds = roundRequests > 0 ? 0 : stallRounds + 1;
      if (payload.upToDate === true) unverifiedRounds = 0;
      else if (payload.done === true) unverifiedRounds += 1;
      else unverifiedRounds = 0;

      if (typeof payload.detailed === "number") {
        if (payload.detailed > detailedNow) lastProgressAt = Date.now();
        detailedNow = payload.detailed;
      }
      if (typeof payload.known === "number") knownNow = payload.known;
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
        publish();
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

  const { running, error, notice } = state;
  const progress = batchProgress({
    detailed: currentDetailed,
    known: currentKnown,
    baselineDetailed: state.baselineDetailed,
    batchTotal: state.batchTotal,
  });
  const elapsedMs = state.startedAt === null ? 0 : state.now - state.startedAt;
  const sinceProgressMs =
    state.lastProgressAt === null ? 0 : state.now - state.lastProgressAt;
  const stalled = running && !error && sinceProgressMs >= STALL_MS;
  const phaseLabel = state.phase ? PHASE_LABEL[state.phase] : null;

  // Una sola fuente de verdad: el server. El cliente no puede declarar
  // "Actualizado" por su cuenta (ver ADR-018).
  const isUpToDate = upToDate;
  const busy = running || isRefreshing;

  return (
    <div className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:items-end">
      <div className="flex items-center gap-2">
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

        {running ? (
          <>
            <span className="tabular text-[10px] font-semibold text-muted">
              {progress.total > 0
                ? `${progress.analyzed}/${progress.total} · ${progress.pct}%`
                : "…"}
              {phaseLabel ? ` · ${phaseLabel}` : ""}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={stop}
              aria-label="Detener la actualización"
            >
              <Square className="size-3" aria-hidden />
            </Button>
          </>
        ) : null}
      </div>

      {running && progress.total > 0 ? (
        <div className="h-0.5 w-full min-w-[160px] overflow-hidden rounded-full bg-soft">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.max(progress.pct, progress.analyzed > 0 ? 2 : 0)}%`,
            }}
            role="progressbar"
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance de la actualización"
          />
        </div>
      ) : null}

      {error ? (
        <p className="max-w-[280px] text-[10px] leading-snug text-loss">{error}</p>
      ) : null}

      {stalled ? (
        <p className="flex max-w-[280px] items-start gap-1 text-[10px] leading-snug text-gold">
          <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            Sin avance hace {formatElapsed(sinceProgressMs)}. Una vuelta normal
            tarda hasta ~60 s: puede ser el rate limit de Riot o un request
            colgado. Esperá o apretá Detener; el avance queda guardado igual.
          </span>
        </p>
      ) : null}

      {notice && !error && !stalled ? (
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

      {!running && !error && !notice && state.unavailable > 0 ? (
        <p className="text-[10px] leading-snug text-muted">
          {state.unavailable === 1
            ? "Se descartó 1 partida que Riot ya no tiene."
            : `Se descartaron ${state.unavailable} partidas que Riot ya no tiene.`}
        </p>
      ) : null}
    </div>
  );
}
