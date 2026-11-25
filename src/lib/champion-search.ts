/**
 * Búsqueda de campeones dentro de la tabla "Por campeón".
 *
 * Es lógica pura y vive fuera del componente para poder testearla: el buscador
 * es cliente, pero lo único que no se puede probar sin DOM es el input.
 *
 * La comparación normaliza acentos y puntuación, así "kai sa", "Kai'Sa" y
 * "kaisa" encuentran lo mismo (Data Dragon escribe "Kai'Sa", "Cho'Gath",
 * "Dr. Mundo").
 */

export type ChampionSearchRow = {
  /** `championName` de Riot (`Kaisa`, `Nunu`, `MonkeyKing`). */
  championName: string;
  /** Nombre localizado de Data Dragon ("Kai'Sa"). */
  name: string;
};

export type ChampionSearchResult<Row> = {
  /** Campeones jugados que coinciden. Vacío si la búsqueda está en blanco. */
  matches: Row[];
  /** Campeones del catálogo que coinciden pero el jugador nunca jugó. */
  notPlayed: string[];
};

/** Minúsculas, sin acentos ni puntuación: "Kai'Sa" y "kaisa" caen en lo mismo. */
export function normalizeChampionName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Filtra las filas jugadas por nombre visible **o** por id de Riot, y cuando no
 * hay ninguna coincidencia busca en el catálogo para poder decir "todavía no
 * jugó con X" en vez de "ese campeón no existe".
 */
export function searchChampions<Row extends ChampionSearchRow>(
  rows: readonly Row[],
  catalogNames: readonly string[],
  query: string,
): ChampionSearchResult<Row> {
  const needle = normalizeChampionName(query);
  if (!needle) return { matches: [], notPlayed: [] };

  const matches = rows.filter(
    (row) =>
      normalizeChampionName(row.name).includes(needle) ||
      normalizeChampionName(row.championName).includes(needle),
  );

  if (matches.length > 0) return { matches, notPlayed: [] };

  const notPlayed = catalogNames.filter((name) =>
    normalizeChampionName(name).includes(needle),
  );

  return { matches, notPlayed };
}
