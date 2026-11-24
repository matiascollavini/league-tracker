import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlatform } from "@/lib/riot/config";
import { hasApiKey, RiotApiError, RiotDeadlineError } from "@/lib/riot/http";
import { syncAccount } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Avanza el historial de un jugador de a una tanda.
 *
 * El cliente (botón "cargar todo") la llama en bucle hasta que `done` sea true.
 * Cada llamada gasta como máximo RIOT_SYNC_CHUNK requests y
 * RIOT_SYNC_DEADLINE_MS de tiempo, así que nunca se pasa del rate limit ni del
 * tiempo de la función: si se queda sin tiempo, devuelve lo hecho (el progreso
 * ya está guardado) con `done: false`.
 *
 * Ojo con el presupuesto: con dev key son 100 requests cada 2 minutos (~0,83
 * por segundo). 30 requests ≈ 36 s; 40 ya se acerca a los 60 s de `maxDuration`.
 */

const BodySchema = z.object({
  platform: z.string(),
  gameName: z.string().min(1).max(32),
  tagLine: z.string().min(1).max(16),
});

function chunkBudget(): number {
  const raw = Number(process.env.RIOT_SYNC_CHUNK ?? 30);
  if (!Number.isFinite(raw)) return 30;
  return Math.min(500, Math.max(5, Math.floor(raw)));
}

/** Tope de tiempo por vuelta. Deja margen para liberar el lock y responder. */
function chunkDeadlineMs(): number {
  const raw = Number(process.env.RIOT_SYNC_DEADLINE_MS ?? 40_000);
  if (!Number.isFinite(raw)) return 40_000;
  return Math.min(50_000, Math.max(5_000, Math.floor(raw)));
}

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Falta RIOT_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success || !isPlatform(parsed.data.platform)) {
    return NextResponse.json(
      { error: "Plataforma o Riot ID inválido." },
      { status: 400 },
    );
  }

  const { platform, gameName, tagLine } = parsed.data;

  try {
    const result = await syncAccount(platform, gameName, tagLine, {
      budget: chunkBudget(),
      maxPages: 3,
      deadlineMs: chunkDeadlineMs(),
    });

    return NextResponse.json({
      ok: true,
      detailed: result.progress.detailed,
      known: result.progress.known,
      done: result.done,
      requests: result.requests,
      // Si el bucket cortó la vuelta (en la fase que sea), la fase que le
      // importa al cliente es "throttled": no es un lock ni un error.
      phase: result.retryAfterMs ? "throttled" : result.phase,

      elapsedMs: result.elapsedMs,
      unavailable: result.unavailable,
      // Si otro proceso tenía el lock, el cliente espera antes de reintentar.
      skipped: result.skipped,
      lockForMs: result.lockForMs,
      retryAfterMs: result.skipped
        ? Math.min(5_000, result.lockForMs ?? 3_000)
        : 500,
    });
  } catch (error) {
    // Ni siquiera hubo turno en el rate limit (nos comió el presupuesto).
    if (error instanceof RiotDeadlineError) {
      return NextResponse.json({
        ok: true,
        done: false,
        phase: "throttled",
        requests: 0,
        retryAfterMs: Math.min(120_000, error.retryAfterMs || 5_000),
      });
    }
    if (error instanceof RiotApiError && error.status === 429) {
      return NextResponse.json(
        {
          error: "Riot nos frenó un momento. Reintentando…",
          retryAfterMs: 5_000,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de Riot." },
      { status: 502 },
    );
  }
}
