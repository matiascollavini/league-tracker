import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { championIconUrl } from "@/lib/ddragon/champions";
import { percent, type ChampionStat } from "@/lib/riot/aggregate";
import { cn } from "@/lib/utils";

type Props = {
  champions: ChampionStat[];
  version: string;
  /** championName de Riot -> nombre localizado de Data Dragon ("Kaisa" -> "Kai'Sa"). */
  names: Record<string, string>;
  selected?: string;
  totalMatches: number;
  hrefFor: (championName?: string) => string;
};

export function ChampionTable({
  champions,
  version,
  names,
  selected,
  totalMatches,
  hrefFor,
}: Props) {
  if (champions.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No hay partidas para agregar en esta selección.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_4.5rem] items-center gap-2 px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
        <span>Campeón</span>
        <span className="text-right">PJ</span>
        <span className="text-right">WR</span>
      </div>

      <ul className="space-y-1">
        {champions.map((champion) => {
          const isSelected = champion.championName === selected;
          return (
            <li key={champion.championName}>
              <Link
                href={hrefFor(isSelected ? undefined : champion.championName)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_2.5rem_4.5rem] items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                  isSelected
                    ? "border-gold-600/70 bg-gold-600/10"
                    : "border-transparent hover:border-line hover:bg-ink-800/60",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Image
                    src={championIconUrl(version, champion.championName)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded border border-line/80"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-gold-200">
                      {names[champion.championName] ?? champion.championName}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {champion.wins}V {champion.losses}D
                      {totalMatches > 0
                        ? ` · ${Math.round((champion.games / totalMatches) * 100)}% de lo jugado`
                        : ""}
                    </span>
                  </span>
                </span>

                <span className="tabular text-right text-sm text-gold-300">
                  {champion.games}
                </span>

                <span className="relative h-6 overflow-hidden rounded bg-ink-800">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0",
                      champion.winrate >= 0.5 ? "bg-win/25" : "bg-loss/25",
                    )}
                    style={{ width: `${Math.round(champion.winrate * 100)}%` }}
                    aria-hidden
                  />
                  <span className="relative grid h-full place-items-center text-xs tabular text-gold-200">
                    {percent(champion.winrate)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="mt-3 px-1">
          <Link
            href={hrefFor(undefined)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-gold-300"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Quitar filtro de campeón
          </Link>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1 px-1 text-xs text-muted">
          Tocá un campeón para filtrar tus partidas
          <ChevronRight className="size-3" aria-hidden />
        </p>
      )}
    </div>
  );
}
