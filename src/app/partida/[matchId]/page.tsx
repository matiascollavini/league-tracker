import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { MatchTeams } from "@/components/match-teams";
import { getChampionCatalog } from "@/lib/ddragon/champions";
import { getMatchDetail, getPlayerLabel } from "@/lib/db/matches";
import { formatDuration, timeAgo } from "@/lib/riot/aggregate";
import { queueLabel } from "@/lib/riot/config";
import { groupTeams } from "@/lib/riot/panel";
import { cn } from "@/lib/utils";

export const revalidate = 86_400;

type Props = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchId } = await params;
  return { title: `Partida ${matchId}` };
}

export default async function MatchPage({ params, searchParams }: Props) {
  const { matchId } = await params;
  const sp = await searchParams;
  const player = Array.isArray(sp.player) ? sp.player[0] : sp.player;
  // Perfil desde el que se abrió la partida: puede no ser el puuid de la fila
  // (alias), pero siempre es el que tiene el Riot ID guardado.
  const viewer = Array.isArray(sp.viewer) ? sp.viewer[0] : sp.viewer;

  const [detail, catalog] = await Promise.all([
    getMatchDetail(decodeURIComponent(matchId)),
    getChampionCatalog(),
  ]);

  if (!detail) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-[22px] font-extrabold tracking-tight text-fg">
          Esa partida no está en la base
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Solo podemos mostrar partidas que ya hayamos descargado. Corré la
          ingesta del jugador y volvé a intentar.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md border border-primary/20 bg-primary/12 px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Volver al buscador
        </Link>
      </div>
    );
  }

  const names: Record<string, string> = Object.fromEntries(
    catalog.all.map((c) => [c.id, c.name]),
  );

  const label = await getPlayerLabel(viewer ?? player ?? "");
  const backHref = label
    ? `/perfil/${label.platform}/${encodeURIComponent(label.gameName)}/${encodeURIComponent(label.tagLine)}`
    : "/";

  // El resultado del encabezado es el del jugador cuyo perfil estamos viendo,
  // no el de cualquier participante de la partida (siempre hay uno que ganó).
  const me = player
    ? detail.participants.find((p) => p.puuid === player)
    : undefined;
  const resultWin = me ? me.win : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3" aria-hidden />
          {label ? "Volver al perfil" : "Volver al buscador"}
        </Link>
        <span className="font-mono text-[10px] text-dim">{detail.matchId}</span>
      </div>

      <header
        className={cn(
          "rounded-md border px-4 py-3",
          resultWin === null
            ? "border-white/5 bg-card"
            : resultWin
              ? "border-primary/20 bg-win-tint"
              : "border-loss/20 bg-loss-tint",
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1
            className={cn(
              "text-[18px] font-extrabold tracking-tight",
              resultWin === null
                ? "text-fg"
                : resultWin
                  ? "text-primary"
                  : "text-loss",
            )}
          >
            {resultWin === null ? "Partida" : resultWin ? "Victoria" : "Derrota"}
          </h1>
          <span className="text-[13px] font-semibold text-fg">
            {queueLabel(detail.queueId)}
          </span>
          <span className="text-[13px] text-muted">
            {formatDuration(detail.durationSeconds)}
          </span>
          <span className="text-[13px] text-muted">{timeAgo(detail.startedAt)}</span>
          <span className="ml-auto text-[10px] font-medium text-dim">
            parche {detail.gameVersion.split(".").slice(0, 2).join(".")}
          </span>
        </div>
      </header>

      <MatchTeams
        teams={groupTeams(detail.participants)}
        version={catalog.version}
        names={names}
        mePuuid={me?.puuid ?? null}
      />

      <p className="flex items-center gap-1.5 text-[10px] font-medium text-dim">
        <Swords className="size-3" aria-hidden />
        Datos de la API oficial de Riot, guardados en la base. Las partidas son
        inmutables: lo que ves no cambia.
      </p>
    </div>
  );
}
