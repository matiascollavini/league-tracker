import type { MatchSummary } from "@/lib/riot/aggregate";
import { percent } from "@/lib/riot/aggregate";

const ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

const LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungla",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

/** Reparto de partidas y winrate por rol, en chips compactos. */
export function RoleStrip({ rows }: { rows: MatchSummary[] }) {
  const stats = new Map<string, { games: number; wins: number }>();

  for (const row of rows) {
    if (!row.role) continue;
    const current = stats.get(row.role) ?? { games: 0, wins: 0 };
    current.games += 1;
    if (row.win) current.wins += 1;
    stats.set(row.role, current);
  }

  const entries = [...stats.entries()].sort(
    (a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]),
  );
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {entries.map(([role, stat]) => {
        const winrate = stat.games > 0 ? stat.wins / stat.games : 0;
        return (
          <li
            key={role}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-900/70 px-2.5 py-1 text-[11px]"
          >
            <span className="text-muted">{LABEL[role] ?? role}</span>
            <span className="tabular text-gold-300">{stat.games}</span>
            <span
              className={
                winrate >= 0.5 ? "tabular text-win" : "tabular text-loss"
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
