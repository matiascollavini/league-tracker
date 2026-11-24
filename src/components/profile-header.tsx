import Image from "next/image";
import { FlaskConical } from "lucide-react";
import { PLATFORM_LABEL, type Platform } from "@/lib/riot/config";
import { profileIconUrl } from "@/lib/ddragon/champions";
import type { LeagueEntry } from "@/lib/riot/types";
import { WinrateBar } from "@/components/winrate-bar";
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
  /** El rango sale de una foto guardada: puede estar desactualizado. */
  rankStale?: boolean;
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

/** Tarjeta de identidad + rango, pensada para la barra lateral (estilo op.gg). */
export function ProfileCard({
  gameName,
  tagLine,
  platform,
  level,
  iconId,
  version,
  league,
  demo,
  rankStale = false,
}: Props) {
  const solo = league.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flex = league.find((entry) => entry.queueType === "RANKED_FLEX_SR");

  return (
    <div className="rounded-xl border border-line bg-ink-900/80 p-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="size-16 overflow-hidden rounded-xl border border-gold-600/50 bg-ink-800">
            {iconId ? (
              <Image
                src={profileIconUrl(version, iconId)}
                alt={`Icono de invocador de ${gameName}`}
                width={64}
                height={64}
                className="size-full object-cover"
                priority
              />
            ) : (
              <span className="grid size-full place-items-center text-xl font-bold text-gold-600">
                {gameName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          {level ? (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-ink-950 px-1.5 py-0.5 text-[10px] font-medium text-gold-400 ring-1 ring-line">
              {level}
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-tight text-gold-200">
            {gameName}
            <span className="text-muted">#{tagLine}</span>
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {PLATFORM_LABEL[platform]}
          </p>
          {demo ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-gold-600/50 bg-gold-600/10 px-2 py-0.5 text-[10px] font-medium text-gold-400">
              <FlaskConical className="size-3" aria-hidden /> demo
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <RankCard label="Solo/Duo" entry={solo} />
        <RankCard label="Flex" entry={flex} />
      </div>

      {rankStale ? (
        <p className="mt-2 text-[10px] leading-relaxed text-muted/70">
          Rango guardado: Riot no respondió en este momento, puede estar
          desactualizado.
        </p>
      ) : null}
    </div>
  );
}

function RankCard({
  label,
  entry,
}: {
  label: string;
  entry: LeagueEntry | undefined;
}) {
  if (!entry?.tier) {
    return (
      <div className="rounded-lg border border-line/70 bg-ink-850/70 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 text-xs text-muted/70">Sin clasificar</p>
      </div>
    );
  }

  const wins = entry.wins ?? 0;
  const losses = entry.losses ?? 0;
  const total = wins + losses;
  const winrate = total > 0 ? wins / total : 0;

  return (
    <div className="rounded-lg border border-line/70 bg-ink-850/70 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="tabular text-[11px] text-muted">
          {entry.leaguePoints ?? 0} LP
        </span>
      </div>

      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          TIER_COLOR[entry.tier] ?? "text-gold-300",
        )}
      >
        {entry.tier} {entry.rank ?? ""}
      </p>

      <WinrateBar value={winrate} size="sm" className="mt-1.5" />

      <p className="mt-1 text-[11px] text-muted">
        <span className="tabular text-win">{wins}V</span>{" "}
        <span className="tabular text-loss">{losses}D</span>
        <span className="tabular ml-1.5 text-gold-400">
          {Math.round(winrate * 100)}%
        </span>
      </p>
    </div>
  );
}
