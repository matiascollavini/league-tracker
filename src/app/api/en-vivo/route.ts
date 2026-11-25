import { NextResponse } from "next/server";
import { z } from "zod";
import { isPlatform } from "@/lib/riot/config";
import { hasApiKey } from "@/lib/riot/http";
import { getActiveGame } from "@/lib/riot/spectator";

export const dynamic = "force-dynamic";

/**
 * Chequeo liviano de "¿sigue en partida?" para el chip del perfil.
 *
 * El render del perfil cachea SPECTATOR-V5 30 s (y el botón "Actualizar"
 * invalida el tag). Una página abierta no se vuelve a renderizar sola, así que
 * el chip pregunta acá cada 45 s: si Riot ya devuelve 404, el badge desaparece
 * sin que el usuario recargue.
 *
 * No es un endpoint público de datos: solo devuelve un booleano y reusa la
 * misma caché de `getActiveGame` que el perfil, así que N espectadores de la
 * misma partida comparten el request a Riot.
 */

const QuerySchema = z.object({
  platform: z.string(),
  puuid: z.string().min(20).max(100),
});

/** Mismo presupuesto que el chip: si el bucket está seco, no colgamos el poll. */
const DEADLINE_MS = 3_000;

export async function GET(request: Request) {
  if (!hasApiKey()) return NextResponse.json({ live: null });

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    platform: url.searchParams.get("platform"),
    puuid: url.searchParams.get("puuid"),
  });
  if (!parsed.success || !isPlatform(parsed.data.platform)) {
    return NextResponse.json(
      { error: "Plataforma o puuid inválido." },
      { status: 400 },
    );
  }

  try {
    const game = await getActiveGame(
      parsed.data.puuid,
      parsed.data.platform,
      Date.now() + DEADLINE_MS,
    );
    // false = Riot ya no lo ve en partida (404). true = sigue jugando.
    return NextResponse.json({ live: game !== null });
  } catch {
    // 429/5xx/timeout: no sabemos. El chip se queda como está y reintenta.
    return NextResponse.json({ live: null });
  }
}
