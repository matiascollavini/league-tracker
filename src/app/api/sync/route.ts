import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlatform } from "@/lib/riot/config";
import { hasApiKey, RiotApiError } from "@/lib/riot/http";
import { syncAccount } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Avanza el historial de un jugador de a una tanda.
 *
 * El cliente (botón "cargar todo") la llama en bucle hasta que `done` sea true.
 * Cada llamada gasta como máximo RIOT_SYNC_CHUNK requests, así que nunca se
 * pasa del rate limit ni del tiempo de la función.
 *
 * Con personal key conviene 40 (~50 s). Con production key se puede subir a 300.
 */

const BodySchema = z.object({
  platform: z.string(),
  gameName: z.string().min(1).max(32),
  tagLine: z.string().min(1).max(16),
});

function chunkBudget(): number {
  const raw = Number(process.env.RIOT_SYNC_CHUNK ?? 40);
  if (!Number.isFinite(raw)) return 40;
  return Math.min(500, Math.max(5, Math.floor(raw)));
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
    });

    return NextResponse.json({
      ok: true,
      detailed: result.progress.detailed,
      known: result.progress.known,
      done: result.done,
      requests: result.requests,
      // Si otro proceso tenía el lock, el cliente espera antes de reintentar.
      retryAfterMs: result.skipped ? 3_000 : 500,
    });
  } catch (error) {
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
