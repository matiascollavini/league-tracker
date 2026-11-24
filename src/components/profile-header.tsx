import Image from "next/image";
import { BadgeCheck, FlaskConical } from "lucide-react";
import { PLATFORM_LABEL, type Platform } from "@/lib/riot/config";
import { profileIconUrl } from "@/lib/ddragon/champions";
import type { LeagueEntry } from "@/lib/riot/types";
import { cn } from "@/lib/utils";

type Props = {
  gameName: string;
  tagLine: string;
  platform: Platform;
  level: number | null;
  iconId: number | null;
  version: string;
  league: LeagueEntry[];
  demo: boolean;
};

const TIER_COLOR: Record<string, string> = {
  IRON: "text-muted",
  BRONZE: "text-amber-600",
  SILVER: "text-slate-300",
  GOLD: "text-yellow-400",
  PLATINUM: "text-teal-300",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-sky-400",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400",
  CHALLENGER: "text-gold-300",
};

const QUEUE_NAME: Record<string, string> = {
  RANKED_SOLO_5x5: "Solo/Duo",
  RANKED_FLEX_SR: "Flex",
};

export function ProfileHeader({
  gameName,
  tagLine,
  platform,
  level,
  iconId,
  version,
  league,
  demo,
}: Props) {
  const solo = league.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flex = league.find((entry) => entry.queueType === "RANKED_FLEX_SR");

  return (
    <header className="flex flex-col gap-4 rounded-xl border border-line bg-ink-900/80 p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-gold-600/50 bg-ink-800">
        {iconId ? (
          <Image
            src={profileIconUrl(version, iconId)}
            alt={`Icono de invocador de ${gameName}`}
            width={80}
            height={80}
            className="size-full object-cover"
            priority
          />
        ) : (
          <span className="grid size-full place-items-center text-2xl font-bold text-gold-600">
            {gameName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-2xl font-semibold text-gold-200">
            {gameName}
            <span className="text-muted">#{tagLine}</span>
          </h1>
          {demo ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-600/50 bg-gold-600/10 px-2 py-0.5 text-[11px] font-medium text-gold-400">
              <FlaskConical className="size-3" aria-hidden /> demo
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-muted">
          {PLATFORM_LABEL[platform]}
          {level ? ` · Nivel ${level}` : ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <RankBadge label="Solo/Duo" entry={solo} />
          <RankBadge label="Flex" entry={flex} />
        </div>
      </div>
    </header>
  );
}

function RankBadge({
  label,
  entry,
}: {
  label: string;
  entry: LeagueEntry | undefined;
}) {
  if (!entry?.tier) {
    return (
      <span className="text-xs text-muted">
        {label}: <span className="text-muted/70">sin clasificar</span>
      </span>
    );
  }

  const wins = entry.wins ?? 0;
  const losses = entry.losses ?? 0;
  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <span className="inline-flex items-center gap-2">
      <BadgeCheck className="size-4 text-gold-600" aria-hidden />
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold",
          TIER_COLOR[entry.tier] ?? "text-gold-300",
        )}
      >
        {entry.tier} {entry.rank ?? ""}
      </span>
      <span className="tabular text-xs text-muted">
        {entry.leaguePoints ?? 0} LP · {winrate}% ({wins}V {losses}D)
      </span>
    </span>
  );
}

export { QUEUE_NAME };
