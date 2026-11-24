import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { getChampionCatalog, championIconUrl } from "@/lib/ddragon/champions";
import { getMatchDetail, getPlayerLabel } from "@/lib/db/matches";
import {
  formatDuration,
  kdaOf,
  roleOrderIndex,
  timeAgo,
} from "@/lib/riot/aggregate";
import { queueLabel } from "@/lib/riot/config";
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

const ROLE_LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungla",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

export default async function MatchPage({ params, searchParams }: Props) {
  const { matchId } = await params;
  const sp = await searchParams;
  const player = Array.isArray(sp.player) ? sp.player[0] : sp.player;

  const [detail, catalog] = await Promise.all([
    getMatchDetail(decodeURIComponent(matchId)),
    getChampionCatalog(),
  ]);

  if (!detail) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-semibold text-gold-200">
          Esa partida no está en la base
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Solo podemos mostrar partidas que ya hayamos descargado. Corré la
          ingesta del jugador y volvé a intentar.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-gold-400"
        >
          Volver al buscador
        </Link>
      </div>
    );
  }

  const names: Record<string, string> = Object.fromEntries(
    catalog.all.map((c) => [c.id, c.name]),
  );

  const label = player ? await getPlayerLabel(player) : null;
  const backHref = label
    ? `/perfil/${label.platform}/${encodeURIComponent(label.gameName)}/${encodeURIComponent(label.tagLine)}`
    : "/";

  const teams = [100, 200]
    .map((teamId) => ({
      teamId,
      participants: detail.participants
        .filter((p) => p.teamId === teamId)
        .sort((a, b) => roleOrderIndex(a.position) - roleOrderIndex(b.position)),
    }))
    .filter((team) => team.participants.length > 0);

  const winner = detail.participants.find((p) => p.win);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-gold-300"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Volver al perfil
        </Link>
        <span className="font-mono text-[11px] text-muted/60">{detail.matchId}</span>
      </div>

      <header
        className={cn(
          "rounded-xl border p-4",
          winner?.win
            ? "border-win/40 bg-win/[0.06]"
            : "border-loss/40 bg-loss/[0.06]",
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1
            className={cn(
              "text-xl font-semibold",
              winner?.win ? "text-win" : "text-loss",
            )}
          >
            {winner?.win ? "Victoria" : "Derrota"}
          </h1>
          <span className="text-sm text-gold-300">
            {queueLabel(detail.queueId)}
          </span>
          <span className="text-sm text-muted">
            {formatDuration(detail.durationSeconds)}
          </span>
          <span className="text-sm text-muted">{timeAgo(detail.startedAt)}</span>
          <span className="ml-auto text-[11px] text-muted">
            parche {detail.gameVersion.split(".").slice(0, 2).join(".")}
          </span>
        </div>
      </header>

      {teams.map((team) => {
        const teamWin = team.participants[0]?.win ?? false;
        return (
          <section
            key={team.teamId}
            className="overflow-hidden rounded-xl border border-line bg-ink-900/80"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                {team.teamId === 100 ? "Equipo azul" : "Equipo rojo"}
              </h2>
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wide",
                  teamWin ? "text-win" : "text-loss",
                )}
              >
                {teamWin ? "Victoria" : "Derrota"}
              </span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-3 py-1.5 text-left font-medium">Jugador</th>
                  <th className="px-2 py-1.5 text-right font-medium">KDA</th>
                  <th className="hidden px-2 py-1.5 text-right font-medium sm:table-cell">
                    CS
                  </th>
                  <th className="hidden px-2 py-1.5 text-right font-medium sm:table-cell">
                    Oro
                  </th>
                  <th className="hidden px-2 py-1.5 text-right font-medium sm:table-cell">
                    Visión
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium">Daño</th>
                </tr>
              </thead>
              <tbody>
                {team.participants.map((p) => {
                  const isMe = p.puuid === player;
                  return (
                    <tr
                      key={p.puuid}
                      className={cn(
                        "border-t border-line/60",
                        isMe && "bg-gold-600/10",
                      )}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={championIconUrl(catalog.version, p.championName)}
                            alt=""
                            width={28}
                            height={28}
                            className="size-7 shrink-0 rounded border border-line/80"
                          />
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "truncate text-sm",
                                isMe ? "text-gold-200" : "text-gold-300",
                              )}
                            >
                              {p.riotId ?? "Jugador"}
                              {isMe ? (
                                <span className="ml-1 text-[10px] text-gold-500">
                                  vos
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-[11px] text-muted">
                              {names[p.championName] ?? p.championName}
                              {p.position && ROLE_LABEL[p.position]
                                ? ` · ${ROLE_LABEL[p.position]}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular text-gold-300">
                        {p.kills}/{p.deaths}/{p.assists}
                        <span className="ml-1 hidden text-[11px] text-muted sm:inline">
                          {kdaOf(p.kills, p.deaths, p.assists).toFixed(1)}
                        </span>
                      </td>
                      <td className="hidden px-2 py-1.5 text-right tabular text-muted sm:table-cell">
                        {p.cs}
                      </td>
                      <td className="hidden px-2 py-1.5 text-right tabular text-muted sm:table-cell">
                        {(p.gold / 1000).toFixed(1)}k
                      </td>
                      <td className="hidden px-2 py-1.5 text-right tabular text-muted sm:table-cell">
                        {p.vision}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular text-muted">
                        {(p.damage / 1000).toFixed(1)}k
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Swords className="size-3" aria-hidden />
        Datos de la API oficial de Riot, guardados en la base. Las partidas son
        inmutables: lo que ves no cambia.
      </p>
    </div>
  );
}
