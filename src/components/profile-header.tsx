import Image from "next/image";
import { FlaskConical } from "lucide-react";
import { PLATFORM_LABEL, type Platform } from "@/lib/riot/config";
import { profileIconUrl } from "@/lib/ddragon/champions";
import type { LeagueEntry } from "@/lib/riot/types";
import { WinrateBar } from "@/components/winrate-bar";
import { cn } from "@/lib/utils";

type HeroProps = {
  gameName: string;
  tagLine: string;
  platform: Platform;
  level: number | null;
  iconId: number | null;
  version: string;
  demo: boolean;
  /** Chip de "en partida ahora" (SPECTATOR-V5). Opcional: si Riot no responde, no hay. */
  live?: React.ReactNode;
  /** Acción principal a la derecha (hoy: "Actualizar ahora"). */
  actions?: React.ReactNode;
  /** Barra de tabs (filtro por cola), pegada abajo como en dpm. */
  tabs?: React.ReactNode;
};

/** Paleta de rangos de dpm (theme-rft: --rank-*). */
const TIER_COLOR: Record<string, string> = {
  IRON: "text-[#9a9b9e]",
  BRONZE: "text-[#ca5e16]",
  SILVER: "text-[#e8e9e9]",
  GOLD: "text-gold",
  PLATINUM: "text-[#9fe4f9]",
  EMERALD: "text-[#4ac97f]",
  DIAMOND: "text-[#7988ec]",
  MASTER: "text-[#bd9bf8]",
  GRANDMASTER: "text-[#f03b38]",
  CHALLENGER: "text-[#82dcf7]",
};

/**
 * Encabezado del perfil con la estética de dpm.lol: tarjeta full-width con
 * avatar grande, nombre + tag, chip de región y la barra de tabs abajo.
 */
export function ProfileHero({
  gameName,
  tagLine,
  platform,
  level,
  iconId,
  version,
  demo,
  live,
  actions,
  tabs,
}: HeroProps) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col items-start gap-4 bg-primary/4 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0">
          <div className="size-16 overflow-hidden rounded-lg bg-soft lg:size-[76px]">
            {iconId ? (
              <Image
                src={profileIconUrl(version, iconId)}
                alt={`Icono de invocador de ${gameName}`}
                width={76}
                height={76}
                className="size-full object-cover"
                priority
              />
            ) : (
              <span className="grid size-full place-items-center text-2xl font-extrabold text-primary">
                {gameName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          {level ? (
            <span className="tabular absolute bottom-0 right-0 rounded-br-lg bg-shade/90 px-1 text-[10px] font-semibold leading-[15px] text-muted">
              {level}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 sm:mr-auto">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            <h1 className="flex min-w-0 items-baseline gap-1.5">
              <span className="max-w-[200px] truncate text-[22px] font-semibold leading-tight tracking-[-0.02em] text-fg lg:max-w-[420px]">
                {gameName}
              </span>
              <span className="text-[13px] font-medium text-muted">
                #{tagLine}
              </span>
            </h1>
            <span className="flex h-[20px] shrink-0 items-center rounded bg-white/6 px-1.5 text-[10px] font-semibold text-muted">
              {PLATFORM_LABEL[platform]}
            </span>
            {demo ? (
              <span className="inline-flex items-center gap-1 rounded border border-primary/16 bg-primary/12 px-1.5 py-px text-[10px] font-semibold text-primary">
                <FlaskConical className="size-2.5" aria-hidden /> demo
              </span>
            ) : null}
            {live}
          </div>
        </div>

        {actions ? (
          <div className="w-full shrink-0 sm:w-auto">{actions}</div>
        ) : null}
      </div>

      {tabs}
    </section>
  );
}

type RankProps = {
  league: LeagueEntry[];
  /** El rango sale de una foto guardada: puede estar desactualizado. */
  rankStale?: boolean;
  className?: string;
};

/** Rango actual (Solo/Duo y Flex) como las tarjetas de rank de dpm. */
export function RankSummary({ league, rankStale = false, className }: RankProps) {
  const solo = league.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flex = league.find((entry) => entry.queueType === "RANKED_FLEX_SR");

  return (
    <div className={cn("panel overflow-hidden", className)}>
      <RankRow label="Solo/Duo" entry={solo} />
      <RankRow label="Flex" entry={flex} />
      {rankStale ? (
        <p className="border-t border-line/70 px-3 py-2 text-[10px] leading-relaxed text-dim">
          Rango guardado: Riot no respondió en este momento, puede estar
          desactualizado.
        </p>
      ) : null}
    </div>
  );
}

function RankRow({
  label,
  entry,
}: {
  label: string;
  entry: LeagueEntry | undefined;
}) {
  if (!entry?.tier) {
    return (
      <div className="border-t border-line/70 px-3 py-2.5 first:border-t-0">
        <p className="section-title">{label}</p>
        <p className="mt-1 text-[12px] font-medium text-dim">Sin clasificar</p>
      </div>
    );
  }

  const wins = entry.wins ?? 0;
  const losses = entry.losses ?? 0;
  const total = wins + losses;
  const winrate = total > 0 ? wins / total : 0;

  return (
    <div className="border-t border-line/70 px-3 py-2.5 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="section-title">{label}</span>
        <span className="tabular text-[11px] font-semibold text-muted">
          {entry.leaguePoints ?? 0} LP
        </span>
      </div>

      <p
        className={cn(
          "mt-0.5 text-[13px] font-bold uppercase leading-tight",
          TIER_COLOR[entry.tier] ?? "text-gold",
        )}
      >
        {entry.tier} {entry.rank ?? ""}
      </p>

      <p className="tabular text-[11px] font-medium text-muted">
        {wins}V - {losses}D ({Math.round(winrate * 100)}%)
      </p>

      <WinrateBar value={winrate} size="sm" className="mt-1.5" />
    </div>
  );
}
