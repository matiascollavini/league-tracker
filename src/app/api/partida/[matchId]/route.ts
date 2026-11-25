import { NextResponse } from "next/server";
import { getMatchDetail } from "@/lib/db/matches";
import { groupTeams } from "@/lib/riot/panel";

/**
 * Los 10 jugadores de una partida, para el desplegable de "Últimas partidas".
 *
 * La lista del perfil trae solo el participante del jugador (una sola consulta
 * para ~1.000 partidas). Cuando alguien despliega una fila, se lee acá la
 * partida completa de `match_participants`, que ya está guardada: **este
 * endpoint nunca sale a Riot**, así que desplegar no gasta rate limit.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const id = decodeURIComponent(matchId);

  // Los ids de match-v5 son "PLATAFORMA_NÚMERO" (ej. LA2_1639441889).
  if (!/^[A-Za-z0-9]{1,10}_\d{1,20}$/.test(id)) {
    return NextResponse.json({ error: "Partida inválida." }, { status: 400 });
  }

  const detail = await getMatchDetail(id);
  if (!detail) {
    return NextResponse.json(
      { error: "Esa partida todavía no está en la base." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { teams: groupTeams(detail.participants) },
    {
      // Las partidas son inmutables: sirve cachear fuerte. Si algún día se
      // agrega el timeline, este TTL es el que hay que revisar.
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
