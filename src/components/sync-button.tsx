"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
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

type State = {
  running: boolean;
  detailed: number;
  known: number;
  error: string | null;
  done: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Botón para completar el historial. Va pidiendo tandas al servidor y muestra
 * el progreso; al terminar refresca la página.
 */
export function SyncButton({
  platform,
  gameName,
  tagLine,
  known,
  detailed,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>({
    running: false,
    detailed,
    known,
    error: null,
    done: false,
  });

  async function run() {
    setState((prev) => ({ ...prev, running: true, error: null }));

    // Tope de vueltas: 60 × 40 requests = 2.400, más que el máximo real.
    for (let round = 0; round < 60; round++) {
      let payload: {
        ok?: boolean;
        detailed?: number;
        known?: number;
        done?: boolean;
        retryAfterMs?: number;
        error?: string;
      };

      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, gameName, tagLine }),
        });
        payload = (await res.json()) as typeof payload;

        if (!res.ok && res.status !== 429) {
          setState((prev) => ({
            ...prev,
            running: false,
            error: payload.error ?? "No se pudo continuar.",
          }));
          return;
        }
      } catch {
        setState((prev) => ({
          ...prev,
          running: false,
          error: "Se cortó la conexión. Probá de nuevo.",
        }));
        return;
      }

      if (typeof payload.detailed === "number") {
        setState((prev) => ({
          ...prev,
          detailed: payload.detailed ?? prev.detailed,
          known: payload.known ?? prev.known,
          error: payload.error ?? null,
        }));
      }

      if (payload.done) {
        setState((prev) => ({ ...prev, running: false, done: true }));
        router.refresh();
        return;
      }

      await sleep(payload.retryAfterMs ?? 600);
    }

    setState((prev) => ({ ...prev, running: false }));
  }

  const pct =
    state.known > 0
      ? Math.min(100, Math.round((state.detailed / state.known) * 100))
      : 0;

  if (state.done) {
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
          disabled={state.running}
        >
          {state.running ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {state.running ? "Analizando…" : "Cargar todo el historial"}
        </Button>

        <span className="tabular text-[11px] text-muted">
          {state.detailed} de {state.known} partidas
          {state.known > 0 ? ` · ${pct}%` : ""}
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

      {state.error ? (
        <p className="text-[11px] text-loss">{state.error}</p>
      ) : (
        <p className="text-[11px] text-muted">
          Se puede cerrar la página: el avance queda guardado y se retoma donde
          quedó.
        </p>
      )}
    </div>
  );
}
