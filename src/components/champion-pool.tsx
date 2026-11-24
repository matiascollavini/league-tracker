import Image from "next/image";
import Link from "next/link";
import { championIconUrl } from "@/lib/ddragon/champions";
import { percent, type ChampionStat } from "@/lib/riot/aggregate";
import { cn } from "@/lib/utils";

type Props = {
  champions: ChampionStat[];
  names: Record<string, string>;
  version: string;
  selected?: string;
  hrefFor: (championName?: string) => string;
};

/**
 * Los 3 campeones más jugados, como la lista "Champion performance" de
 * dpm.lol: filas de 36px con el WR a la derecha.
 */
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
    <ul className="panel overflow-hidden">
      {top.map((champion) => {
        const active = champion.championName === selected;
        const good = champion.winrate >= 0.5;
        return (
          <li key={champion.championName}>
            <Link
              href={hrefFor(active ? undefined : champion.championName)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 transition-colors hover:bg-soft/40",
                active && "bg-primary/8",
              )}
            >
              <Image
                src={championIconUrl(version, champion.championName)}
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-sm bg-soft object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
                <div className="truncate text-[13px] font-semibold text-fg">
                  {names[champion.championName] ?? champion.championName}
                </div>
                <div className="text-[10px] font-medium text-muted">
                  {champion.kda.toFixed(1)} KDA · {champion.games} partidas
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap leading-tight">
                <div
                  className={cn(
                    "text-[13px] font-semibold",
                    good ? "text-gold-soft" : "text-orange/80",
                  )}
                >
                  {percent(champion.winrate)}{" "}
                  <span className="text-[11px] font-semibold opacity-70">
                    WR
                  </span>
                </div>
                <div className="tabular text-[10px] font-medium text-muted">
                  {champion.wins}V - {champion.losses}D
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
