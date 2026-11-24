import type { MatchSummary } from "@/lib/riot/aggregate";
import { percent } from "@/lib/riot/aggregate";

/** Orden de los chips. "SIN_ROL" siempre al final. */
const SIN_ROL = "SIN_ROL";
const ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY", SIN_ROL];

const LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungla",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
  [SIN_ROL]: "Sin rol",
};

/** Reparto de partidas y winrate por rol, en chips compactos. */
export function RoleStrip({ rows }: { rows: MatchSummary[] }) {
  const stats = new Map<string, { games: number; wins: number }>();

  for (const row of rows) {
    // ARAM, Arena y custom no tienen rol: van a un chip aparte, no a "Invalid".
    const key = row.role || SIN_ROL;
    const current = stats.get(key) ?? { games: 0, wins: 0 };
    current.games += 1;
    if (row.win) current.wins += 1;
    stats.set(key, current);
  }

  const entries = [...stats.entries()].sort(
    (a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]),
  );
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {entries.map(([role, stat]) => {
        const winrate = stat.games > 0 ? stat.wins / stat.games : 0;
        const noRole = role === SIN_ROL;
        return (
          <li
            key={role}
            title={
              noRole
                ? "ARAM, Arena y otros modos sin posiciones fijas"
                : undefined
            }
            className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-soft/50 px-2 py-1 text-[11px]"
          >
            <span className="font-semibold text-fg">{LABEL[role] ?? role}</span>
            <span className="tabular font-medium text-muted">{stat.games}</span>
            <span
              className={
                winrate >= 0.5
                  ? "tabular font-semibold text-gold"
                  : "tabular font-semibold text-orange"
              }
            >
              {percent(winrate)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
