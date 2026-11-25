import { NextResponse } from "next/server";
import { countAccounts, featuredAccounts } from "@/lib/db/accounts";
import { profileHref } from "@/lib/links";
import { isMockMode } from "@/lib/riot/http";
import { mockAccount } from "@/lib/riot/fixtures";
import { mapAccountHits } from "@/lib/search-hits";
import {
  RecommendedResponseSchema,
  type RecommendedHit,
  type RecommendedResponse,
} from "@/lib/search";

/**
 * Perfiles recomendados para la landing.
 *
 * **No sale a Riot**: son las cuentas del índice propio (`accounts`, ADR-014)
 * con más partidas guardadas. Se usa en dos lugares de la home: el desplegable
 * del buscador grande (cuando está vacío) y la sección de abajo del scroll.
 *
 * La landing sigue siendo estática: esto se pide desde el cliente y el CDN lo
 * cachea 5 minutos, así que una visita no genera tráfico a la base.
 */

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;

export async function GET(request: Request) {
  const requested = Number(
    new URL(request.url).searchParams.get("limit") ?? DEFAULT_LIMIT,
  );
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  if (isMockMode()) {
    // Sin key no hay base: igual mostramos la cuenta de ejemplo para que la
    // landing no quede vacía en modo demo.
    const gameName = mockAccount.gameName ?? "";
    const tagLine = mockAccount.tagLine ?? "";
    const results: RecommendedHit[] =
      gameName && tagLine
        ? [
            {
              gameName,
              tagLine,
              platform: "la2",
              iconUrl: null,
              level: null,
              href: profileHref("la2", gameName, tagLine),
              games: 20,
            },
          ]
        : [];
    return NextResponse.json(
      RecommendedResponseSchema.parse({
        results,
        indexed: results.length,
      } satisfies RecommendedResponse),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const rows = await featuredAccounts(limit);
    const results: RecommendedHit[] = (await mapAccountHits(rows)).map(
      ({ hit, row }) => ({ ...hit, games: row.games }),
    );

    const body = RecommendedResponseSchema.parse({
      results,
      indexed: await countAccounts(),
    } satisfies RecommendedResponse);

    return NextResponse.json(body, {
      headers: {
        // Cambia con el ingest, no con cada visita: TTL corto en el browser,
        // más largo en el CDN, y revalidación en background.
        "Cache-Control":
          "public, max-age=30, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch {
    // Base caída (o esquema sin crear): la landing no se rompe por esto.
    return NextResponse.json(
      RecommendedResponseSchema.parse({
        results: [],
        indexed: 0,
      } satisfies RecommendedResponse),
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
