import { roleOrderIndex, type MatchSummary } from "./aggregate";

/**
 * Reparto de partidas por rol (posición del jugador).
 *
 * El rol sale de `MatchSummary.role`, que `toMatchSummaries` normaliza a
 * TOP/JUNGLE/MIDDLE/BOTTOM/UTILITY o "" cuando el modo no tiene posiciones
 * fijas (ARAM, Arena, custom). Ese "" es un valor propio del filtro: `"none"`,
 * porque la URL no puede distinguir "sin filtro" de "filtro vacío".
 */

export const ROLE_FILTERS = [
  { id: "TOP", label: "Top" },
  { id: "JUNGLE", label: "Jungla" },
  { id: "MIDDLE", label: "Mid" },
  { id: "BOTTOM", label: "ADC" },
  { id: "UTILITY", label: "Support" },
  { id: "none", label: "Sin rol" },
] as const;

export type RoleFilterId = (typeof ROLE_FILTERS)[number]["id"];

/** Valor del filtro para las partidas sin posición fija. */
export const NO_ROLE: RoleFilterId = "none";

export const ROLE_LABEL: Record<RoleFilterId, string> = Object.fromEntries(
  ROLE_FILTERS.map((role) => [role.id, role.label]),
) as Record<RoleFilterId, string>;

export function isRoleFilter(
  value: string | null | undefined,
): value is RoleFilterId {
  return ROLE_FILTERS.some((role) => role.id === value);
}

/** Rol de una partida (`""` = sin posición) como valor de filtro. */
export function roleFilterOf(role: string): RoleFilterId {
  return isRoleFilter(role) ? role : NO_ROLE;
}

/** true si la partida se jugó en ese rol. */
export function matchesRoleFilter(
  row: Pick<MatchSummary, "role">,
  filter: RoleFilterId,
): boolean {
  return roleFilterOf(row.role) === filter;
}

export type RoleStat = {
  role: RoleFilterId;
  label: string;
  games: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winrate: number;
};

/**
 * Partidas y winrate por rol, del más jugado al menos jugado.
 *
 * Desempate por el orden de las líneas (Top → Support, "Sin rol" al final), no
 * por winrate: con el mismo volumen el orden tiene que ser estable y no
 * reordenarse cada vez que cambia una partida.
 */
export function roleStats(rows: readonly MatchSummary[]): RoleStat[] {
  const stats = new Map<RoleFilterId, RoleStat>();

  for (const row of rows) {
    const key = roleFilterOf(row.role);
    const current = stats.get(key) ?? {
      role: key,
      label: ROLE_LABEL[key],
      games: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
    };
    current.games += 1;
    if (row.win) current.wins += 1;
    current.losses = current.games - current.wins;
    current.winrate = current.wins / current.games;
    stats.set(key, current);
  }

  return [...stats.values()].sort(
    (a, b) => b.games - a.games || roleOrderIndex(a.role) - roleOrderIndex(b.role),
  );
}
