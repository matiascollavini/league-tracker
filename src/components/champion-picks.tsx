import Image from "next/image";
import Link from "next/link";
import { championIconUrl } from "@/lib/ddragon/champions";
import { percent, type ChampionStat } from "@/lib/riot/aggregate";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** Ya vienen elegidos y ordenados por `pickHighlights`. */
  champions: ChampionStat[];
  names: Record<string, string>;
  version: string;
  selected?: string;
  hrefFor: (championName?: string) => string;
  /** "best" tiñe el título de verde; "worst", de rojo. */
  tone: "best" | "worst";
  emptyLabel: string;
  /** Aclaración de la regla al pie (muestra mínima, umbral de WR). */
  hint?: string;
};

/**
 * Tarjetas de recomendación del perfil ("Mejores picks" / "No pickees más
 * esto"). Son solo lectura del agregado que ya calculó la página: no piden
 * nada a Riot ni tocan la lista del pool.
 */
export function ChampionPicks({
  title,
  champions,
  names,
  version,
  selected,
  hrefFor,
  tone,
  emptyLabel,
  hint,
}: Props) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-baseline justify-between gap-2 px-3 pb-1 pt-2.5">
        <h2
          className={cn(
            "section-title",
            tone === "worst" ? "section-title--loss" : "section-title--win",
          )}
        >
          {title}
        </h2>
        <span className="text-[10px] font-medium text-dim">WR</span>
      </div>

      {champions.length === 0 ? (
        <p className="px-3 pb-3 pt-1 text-[11px] leading-relaxed text-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="pb-1">
          {champions.map((champion) => {
            const active = champion.championName === selected;
            const good = champion.winrate >= 0.5;
            return (
              <li key={champion.championName}>
                <Link
                  href={hrefFor(active ? undefined : champion.championName)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-soft/40",
                    active && "bg-primary/8",
                  )}
                >
                  <Image
                    src={championIconUrl(version, champion.championName)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded-sm bg-soft object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-[12px] font-semibold text-fg">
                      {names[champion.championName] ?? champion.championName}
                    </span>
                    <span className="tabular text-[10px] font-medium text-muted">
                      {champion.games} partidas · {champion.wins}V{" "}
                      {champion.losses}D
                    </span>
                  </div>
                  <span
                    className={cn(
                      "tabular shrink-0 text-[12px] font-bold",
                      good ? "text-gold-soft" : "text-orange/80",
                    )}
                  >
                    {percent(champion.winrate)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hint ? (
        <p className="mt-1 border-t border-line/50 px-3 pb-2 pt-2 text-[10px] leading-relaxed text-dim">
          {hint}
        </p>
      ) : null}
    </section>
  );
}
