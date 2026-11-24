import Image from "next/image";
import Link from "next/link";
import { championIconUrl } from "@/lib/ddragon/champions";
import {
  formatClock,
  formatDuration,
  timeAgo,
  type MatchSummary,
} from "@/lib/riot/aggregate";
import { cn } from "@/lib/utils";

type Props = {
  matches: MatchSummary[];
  version: string;
  /** championName de Riot -> nombre localizado de Data Dragon. */
  names: Record<string, string>;
  /** Para linkear al detalle resaltando a este jugador. */
  puuid: string;
};

/**
 * Filas de partida con la estética de dpm.lol: barra de 62px, tinte azul en
 * victoria y rojo en derrota, brillo diagonal, y las métricas alineadas en
 * columnas fijas (meta · campeón · KDA · stats).
 */
export function MatchList({ matches, version, names, puuid }: Props) {
  if (matches.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[13px] text-muted">
        No hay partidas para mostrar con este filtro.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {matches.map((match) => {
        // El puuid de la fila: sus partidas viejas y nuevas pueden estar
        // guardadas con puuids distintos.
        const rowPuuid = match.puuid || puuid;
        // Si la fila es de un alias, el perfil desde el que se vino viaja aparte
        // (`viewer`) para que "volver al perfil" no dependa de resolver el alias.
        const viewer =
          rowPuuid === puuid ? "" : `&viewer=${encodeURIComponent(puuid)}`;

        return (
          <li key={match.matchId}>
            <Link
              href={`/partida/${encodeURIComponent(match.matchId)}?player=${encodeURIComponent(rowPuuid)}${viewer}`}
              className={cn(
                "match-row group grid h-[62px] grid-cols-[74px_minmax(0,1fr)_96px_20px] items-center gap-3 pl-3 pr-2 transition-colors hover:brightness-110",
                "sm:grid-cols-[92px_200px_minmax(0,1fr)_72px_20px] lg:grid-cols-[92px_240px_minmax(0,1fr)_72px_20px]",
                match.win ? "match-row--win" : "match-row--loss",
              )}
            >
              {/* meta: hora, hace cuánto y cola */}
              <div className="leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="tabular text-[12px] font-semibold text-fg">
                    {formatClock(match.playedAt)}
                  </span>
                  <span className="hidden text-[10px] font-medium text-muted lg:inline">
                    {timeAgo(match.playedAt)}
                  </span>
                </div>
                <div className="truncate text-[12px] font-bold text-fg">
                  {match.queueLabel}
                </div>
              </div>

              {/* campeón */}
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="relative shrink-0">
                  <Image
                    src={championIconUrl(version, match.championName)}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-sm bg-soft object-cover brightness-105"
                  />
                  <span
                    className={cn(
                      "absolute -bottom-1 -left-1.5 grid size-[18px] place-items-center rounded-[3px] p-[3px] text-[9px] font-bold ring-1 ring-white/15",
                      match.win
                        ? "bg-primary/20 text-primary"
                        : "bg-loss/20 text-loss",
                    )}
                    aria-hidden="true"
                  >
                    {match.win ? "V" : "D"}
                  </span>
                </span>
                <span className="hidden min-w-0 leading-tight sm:block">
                  <span className="block truncate text-[13px] font-semibold text-fg">
                    {names[match.championName] ?? match.championName}
                  </span>
                  <span className="block text-[10px] font-medium text-muted">
                    {match.position}
                  </span>
                </span>
              </div>

              {/* KDA + resultado */}
              <div className="flex flex-col items-center justify-self-center text-center">
                <div className="tabular text-[15px] font-bold leading-none text-fg">
                  {match.kills}
                  <span className="text-[12px] font-light text-muted"> / </span>
                  <span className="text-loss">{match.deaths}</span>
                  <span className="text-[12px] font-light text-muted"> / </span>
                  {match.assists}
                </div>
                <div className="mt-1 text-[11px] font-bold text-blue sm:text-[12px]">
                  {match.kda.toFixed(2)} KDA
                </div>
                <span
                  className={cn(
                    "mt-1 inline-block max-w-full truncate rounded px-1.5 py-px text-[9px] font-semibold",
                    match.win
                      ? "bg-primary/12 text-primary"
                      : "bg-orange/12 text-orange",
                  )}
                >
                  {match.win ? "Victoria" : "Derrota"}
                </span>
              </div>

              {/* stats */}
              <div className="hidden text-[10px] font-medium leading-tight text-muted sm:block">
                <div className="text-[12px] font-bold text-fg">{match.cs} CS</div>
                <div>{match.vision} visión</div>
                <div className="tabular">{formatDuration(match.durationSeconds)}</div>
              </div>

              <span
                className="grid place-items-center text-[14px] text-muted transition-colors group-hover:text-fg"
                aria-hidden="true"
              >
                ›
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
