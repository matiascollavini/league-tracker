import Image from "next/image";
import Link from "next/link";
import { championIconUrl } from "@/lib/ddragon/champions";
import { percent, type ChampionStat } from "@/lib/riot/aggregate";
import { WinrateBar } from "@/components/winrate-bar";
import { cn } from "@/lib/utils";

type Props = {
  champions: ChampionStat[];
  names: Record<string, string>;
  version: string;
  selected?: string;
  hrefFor: (championName?: string) => string;
};

/** Los 3 campeones más jugados, en tarjetas (estilo "Most Played"). */
export function ChampionPool({
  champions,
  names,
  version,
  selected,
  hrefFor,
}: Props) {
  const top = champions.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {top.map((champion, index) => {
        const active = champion.championName === selected;
        return (
          <Link
            key={champion.championName}
            href={hrefFor(active ? undefined : champion.championName)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-xl border p-3 transition-colors",
              active
                ? "border-gold-600/70 bg-gold-600/10"
                : "border-line bg-ink-900/70 hover:border-gold-600/40 hover:bg-ink-800/60",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative">
                <Image
                  src={championIconUrl(version, champion.championName)}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 rounded-lg border border-line/80"
                />
                <span className="absolute -left-1 -top-1 grid size-4 place-items-center rounded bg-ink-950/90 text-[9px] font-semibold text-gold-400 ring-1 ring-line">
                  {index + 1}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gold-200">
                  {names[champion.championName] ?? champion.championName}
                </p>
                <p className="text-[11px] text-muted">
                  {champion.games} partidas · {percent(champion.winrate)}
                </p>
              </div>
            </div>

            <WinrateBar value={champion.winrate} className="mt-2.5" />

            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
              <span className="tabular">
                {champion.wins}V {champion.losses}D
              </span>
              <span className="tabular">KDA {champion.kda.toFixed(2)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
