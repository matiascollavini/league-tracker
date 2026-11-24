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
  /** Sin límite de filas. */
  showAll?: boolean;
  /** Links para alternar "ver todos". */
  allHref?: string;
  lessHref?: string;
};

/**
 * Tabla por campeón al estilo dpm: filas compactas con arte de 32px, partidas
 * jugadas y el winrate a la derecha.
 */
export function ChampionTable({
  champions,
  version,
  names,
  selected,
  totalMatches,
  hrefFor,
  showAll = false,
  allHref,
  lessHref,
}: Props) {
  if (champions.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[13px] text-muted">
        No hay partidas para agregar en esta selección.
      </p>
    );
  }

  // Como op.gg: top 8 por defecto, salvo que pidan "ver todos".
  const LIMIT = 8;
  const list = showAll ? champions : champions.slice(0, LIMIT);
  if (!showAll && selected) {
    const selectedStat = champions.find((c) => c.championName === selected);
    if (selectedStat && !list.some((c) => c.championName === selected)) {
      list.push(selectedStat);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_4.25rem] items-center gap-2 px-3 pb-1.5">
        <span className="label">Campeón</span>
        <span className="label text-right">PJ</span>
        <span className="label text-right">WR</span>
      </div>

      <ul>
        {list.map((champion) => {
          const isSelected = champion.championName === selected;
          const good = champion.winrate >= 0.5;
          return (
            <li key={champion.championName}>
              <Link
                href={hrefFor(isSelected ? undefined : champion.championName)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_2.5rem_4.25rem] items-center gap-2 px-3 py-1.5 transition-colors hover:bg-soft/40",
                  isSelected && "bg-primary/8",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Image
                    src={championIconUrl(version, champion.championName)}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-sm bg-soft object-cover"
                  />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13px] font-semibold text-fg">
                      {names[champion.championName] ?? champion.championName}
                    </span>
                    <span className="tabular block text-[10px] font-medium text-muted">
                      {champion.wins}V {champion.losses}D
                      {totalMatches > 0
                        ? ` · ${Math.round((champion.games / totalMatches) * 100)}% de lo jugado`
                        : ""}
                    </span>
                  </span>
                </span>

                <span className="tabular text-right text-[12px] font-bold text-fg">
                  {champion.games}
                </span>

                <span className="text-right leading-tight">
                  <span
                    className={cn(
                      "tabular block text-[13px] font-semibold",
                      good ? "text-gold-soft" : "text-orange/80",
                    )}
                  >
                    {percent(champion.winrate)}
                  </span>
                  <span
                    className="mt-0.5 block h-1 overflow-hidden rounded-full bg-soft"
                    aria-hidden="true"
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        good ? "bg-gold-soft" : "bg-orange/80",
                      )}
                      style={{
                        width: `${Math.max(3, Math.round(champion.winrate * 100))}%`,
                      }}
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {champions.length > LIMIT && allHref && lessHref ? (
        <div className="mt-2 px-3">
          <Link
            href={showAll ? lessHref : allHref}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {showAll ? "Ver menos" : `Ver los ${champions.length} campeones`}
          </Link>
        </div>
      ) : null}

      {selected ? (
        <div className="mt-2 px-3 pb-1">
          <Link
            href={hrefFor(undefined)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-fg"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Quitar filtro de campeón
          </Link>
        </div>
      ) : (
        <p className="mt-2 flex items-center gap-1 px-3 pb-1 text-[11px] text-muted">
          Tocá un campeón para filtrar tus partidas
          <ChevronRight className="size-3" aria-hidden />
        </p>
      )}
    </div>
  );
}
