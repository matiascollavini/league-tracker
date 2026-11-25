import { NextResponse } from "next/server";
import { countAccounts, searchAccounts } from "@/lib/db/accounts";
import { getChampionCatalog, profileIconUrl } from "@/lib/ddragon/champions";
import { profileHref } from "@/lib/links";
import { isPlatform } from "@/lib/riot/config";
import { isMockMode } from "@/lib/riot/http";
import { mockAccount } from "@/lib/riot/fixtures";
import {
  MIN_QUERY_LENGTH,
  SearchResponseSchema,
  type SearchHit,
  type SearchResponse,
} from "@/lib/search";

/**
 * Sugerencias del buscador del header.
 *
 * **No sale a Riot**: `account-v1` no tiene búsqueda por nombre (solo resuelve un
 * Riot ID exacto, ver ADR-014). Devuelve lo que hay en el índice propio de
 * cuentas, que se alimenta con los 10 participantes de cada partida guardada y
 * con cada perfil visitado. Si un nombre no aparece, el usuario todavía puede
 * escribir `Nombre#TAG` y el perfil lo resuelve contra Riot como siempre.
 */

export const dynamic = "force-dynamic";

/** Cuántas cuentas hay indexadas: cambia lento, no hace falta preguntar siempre. */
let indexedCache: { value: number; at: number } | null = null;
async function indexedCount(): Promise<number> {
  if (indexedCache && Date.now() - indexedCache.at < 60_000) {
    return indexedCache.value;
  }
  try {
    const value = await countAccounts();
    indexedCache = { value, at: Date.now() };
    return value;
  } catch {
    return indexedCache?.value ?? 0;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 48);
  const platformParam = url.searchParams.get("platform");
  const limitParam = Number(url.searchParams.get("limit") ?? "8");
  const limit = Number.isFinite(limitParam) ? limitParam : 8;

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      SearchResponseSchema.parse({
        query,
        results: [],
        indexed: await indexedCount(),
      } satisfies SearchResponse),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (isMockMode()) {
    // En modo demo no hay base: igual mostramos la cuenta de ejemplo para que el
    // buscador se pueda probar sin key.
    const haystack = `${mockAccount.gameName}#${mockAccount.tagLine}`.toLowerCase();
    const results: SearchHit[] =
      haystack.includes(query.toLowerCase()) &&
      mockAccount.gameName &&
      mockAccount.tagLine
        ? [
            {
              gameName: mockAccount.gameName,
              tagLine: mockAccount.tagLine,
              platform: "la2",
              iconUrl: null,
              level: null,
              href: profileHref("la2", mockAccount.gameName, mockAccount.tagLine),
            },
          ]
        : [];
    return NextResponse.json(
      SearchResponseSchema.parse({
        query,
        results,
        indexed: results.length,
      } satisfies SearchResponse),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const hits = await searchAccounts(query, {
    limit,
    platform: platformParam && isPlatform(platformParam) ? platformParam : undefined,
  });

  // El catálogo de Data Dragon se necesita solo por la versión del CDN de iconos
  // (viene cacheado por fetch; si DDragon no responde, cae al patch de respaldo).
  const catalog = hits.some((hit) => hit.profileIcon)
    ? await getChampionCatalog()
    : null;

  const results: SearchHit[] = hits.flatMap((hit) => {
    // La plataforma viene de la base; si es basura, no hay a dónde linkear.
    if (!isPlatform(hit.platformId)) return [];
    return [
      {
        gameName: hit.gameName,
        tagLine: hit.tagLine,
        platform: hit.platformId,
        iconUrl:
          hit.profileIcon && catalog
            ? profileIconUrl(catalog.version, hit.profileIcon)
            : null,
        level: hit.level,
        href: profileHref(hit.platformId, hit.gameName, hit.tagLine),
      },
    ];
  });

  const body = SearchResponseSchema.parse({
    query,
    results,
    indexed: await indexedCount(),
  } satisfies SearchResponse);

  return NextResponse.json(body, {
    headers: {
      // Las sugerencias dependen de la base, que cambia con el ingest: TTL corto
      // en el borde para no servir una lista vieja todo el día.
      "Cache-Control": "public, max-age=10, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
