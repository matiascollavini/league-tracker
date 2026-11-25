import type { AccountHit } from "@/lib/db/accounts";
import { getChampionCatalog, profileIconUrl } from "@/lib/ddragon/champions";
import { profileHref } from "@/lib/links";
import { isPlatform } from "@/lib/riot/config";
import type { SearchHit } from "@/lib/search";

/**
 * Filas del índice (`accounts`) → hits listos para la UI.
 *
 * Compartido por `/api/buscar` y `/api/recomendados`: valida la plataforma (sin
 * ella no hay link posible) y arma la URL del icono con la versión de Data
 * Dragon. Devuelve la fila original al lado del hit para que cada endpoint sume
 * sus propios datos (por ejemplo, cuántas partidas tiene la cuenta).
 */
export async function mapAccountHits<T extends AccountHit>(
  rows: T[],
): Promise<Array<{ hit: SearchHit; row: T }>> {
  if (rows.length === 0) return [];

  // El catálogo se necesita solo por la versión del CDN de iconos (viene
  // cacheado por fetch; si DDragon no responde, cae al patch de respaldo).
  const catalog = rows.some((row) => row.profileIcon)
    ? await getChampionCatalog()
    : null;

  return rows.flatMap((row) => {
    // La plataforma viene de la base; si es basura, no hay a dónde linkear.
    if (!isPlatform(row.platformId)) return [];
    return [
      {
        row,
        hit: {
          gameName: row.gameName,
          tagLine: row.tagLine,
          platform: row.platformId,
          iconUrl:
            row.profileIcon && catalog
              ? profileIconUrl(catalog.version, row.profileIcon)
              : null,
          level: row.level,
          href: profileHref(row.platformId, row.gameName, row.tagLine),
        },
      },
    ];
  });
}
