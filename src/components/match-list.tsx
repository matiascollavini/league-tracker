import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon/champions";
import {
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
};

export function MatchList({ matches, version, names }: Props) {
  if (matches.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No hay partidas para mostrar con este filtro.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line/70">
      {matches.map((match) => (
        <li
          key={match.matchId}
          className={cn(
            "flex items-center gap-3 border-l-2 px-3 py-2.5 sm:px-4",
            match.win
              ? "border-win/70 bg-win/[0.04]"
              : "border-loss/70 bg-loss/[0.04]",
          )}
        >
          <span
            className={cn(
              "hidden w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide sm:block",
              match.win ? "text-win" : "text-loss",
            )}
          >
            {match.win ? "Victoria" : "Derrota"}
          </span>

          <Image
            src={championIconUrl(version, match.championName)}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded border border-line/80"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gold-200">
              {names[match.championName] ?? match.championName}
              <span className="ml-2 text-[11px] font-normal text-muted">
                {match.position}
              </span>
            </p>
            <p className="truncate text-[11px] text-muted">
              <span className="sm:hidden">
                {match.win ? "Victoria · " : "Derrota · "}
              </span>
              {match.queueLabel} · {timeAgo(match.playedAt)}
            </p>
          </div>

          <div className="text-right">
            <p className="tabular text-sm text-gold-300">
              {match.kills}/{match.deaths}/{match.assists}
            </p>
            <p className="tabular text-[11px] text-muted">
              {match.kda.toFixed(2)} KDA · {formatDuration(match.durationSeconds)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
