"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { MatchTeams } from "@/components/match-teams";
import { championIconUrl } from "@/lib/ddragon/champions";
import {
  formatDuration,
  type MatchSummary,
  type MatchTimes,
} from "@/lib/riot/aggregate";
import { parsePanelTeams, type PanelTeam } from "@/lib/riot/panel";
import { cn } from "@/lib/utils";

type Props = {
  matches: MatchSummary[];
  /**
   * Hora, "hace cuánto" y fecha de cada partida, pre-formateadas en el server.
   * La fila es un client component: si formateara fechas por su cuenta, el
   * texto podría no coincidir con el HTML del server al hidratar.
   */
  times: Record<string, MatchTimes>;
  /**
   * Equipos ya completos, cuando la partida llegó con sus 10 jugadores (vía
   * directa a Riot o modo demo). Si falta, el detalle se pide al desplegar.
   */
  teamsByMatch?: Record<string, PanelTeam[]>;
  version: string;
  /** championName de Riot -> nombre localizado de Data Dragon. */
  names: Record<string, string>;
  /** Puuid del perfil: se usa para resaltar al jugador en el desplegable. */
  puuid: string;
};

/** Estado del detalle de una fila desplegada. */
type TeamsState = "loading" | "error" | PanelTeam[];

/**
 * Filas de partida con la estética de dpm.lol: barra de 62px, tinte azul en
 * victoria y rojo en derrota, brillo diagonal, y las métricas alineadas en
 * columnas fijas (meta · campeón · KDA · stats).
 *
 * Al hacer click la fila no navega: se despliega el detalle de la partida
 * (los dos equipos) debajo de la fila. Se abre de a una por vez, y la primera
 * vez se piden los 10 jugadores a `/api/partida/[matchId]`.
 */
export function MatchList({
  matches,
  times,
  teamsByMatch,
  version,
  names,
  puuid,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Record<string, TeamsState>>({});

  async function loadTeams(matchId: string) {
    try {
      const response = await fetch(
        `/api/partida/${encodeURIComponent(matchId)}`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const parsed = parsePanelTeams(payload);
      if (!parsed) throw new Error("Respuesta inesperada del servidor.");

      setTeams((prev) => ({ ...prev, [matchId]: parsed }));
    } catch {
      setTeams((prev) => ({ ...prev, [matchId]: "error" }));
    }
  }

  function toggle(matchId: string) {
    if (openId === matchId) {
      setOpenId(null);
      return;
    }

    setOpenId(matchId);
    // Ya pedido (cargando o listo): no se vuelve a pegar. Un error sí se
    // reintenta al reabrir la fila.
    const cached = teams[matchId];
    if (cached && cached !== "error") return;

    const complete = teamsByMatch?.[matchId];
    if (complete) {
      setTeams((prev) => ({ ...prev, [matchId]: complete }));
      return;
    }

    setTeams((prev) => ({ ...prev, [matchId]: "loading" }));
    void loadTeams(matchId);
  }

  if (matches.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[13px] text-muted">
        No hay partidas para mostrar con este filtro.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {matches.map((match) => {
        // El puuid de la fila: sus partidas viejas y nuevas pueden estar
        // guardadas con puuids distintos.
        const rowPuuid = match.puuid || puuid;
        const time = times[match.matchId];
        const state = teams[match.matchId];
        const open = openId === match.matchId;
        const panelId = `partida-${match.matchId}`;
        const detailHref = `/partida/${encodeURIComponent(match.matchId)}?player=${encodeURIComponent(rowPuuid)}${rowPuuid === puuid ? "" : `&viewer=${encodeURIComponent(puuid)}`}`;

        return (
          <li key={match.matchId}>
            <button
              type="button"
              onClick={() => toggle(match.matchId)}
              aria-expanded={open}
              aria-controls={panelId}
              className={cn(
                "match-row group grid h-[62px] w-full cursor-pointer grid-cols-[74px_minmax(0,1fr)_96px_20px] items-center gap-3 pl-3 pr-2 text-left transition-colors hover:brightness-110",
                "sm:grid-cols-[92px_200px_minmax(0,1fr)_72px_20px] lg:grid-cols-[92px_240px_minmax(0,1fr)_72px_20px]",
                match.win ? "match-row--win" : "match-row--loss",
              )}
            >
              {/* meta: hora, hace cuánto y cola */}
              <div className="leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="tabular text-[12px] font-semibold text-fg">
                    {time?.clock ?? ""}
                  </span>
                  <span className="hidden text-[10px] font-medium text-muted lg:inline">
                    {time?.ago ?? ""}
                  </span>
                </div>
                <div className="truncate text-[12px] font-bold text-fg">
                  {match.queueLabel}
                </div>
              </div>

              {/* campeón: el tinte de la fila ya dice si se ganó o se perdió */}
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src={championIconUrl(version, match.championName)}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-sm bg-soft object-cover brightness-105"
                />
                <span className="hidden min-w-0 leading-tight sm:block">
                  <span className="block truncate text-[13px] font-semibold text-fg">
                    {names[match.championName] ?? match.championName}
                  </span>
                  <span className="block text-[10px] font-medium text-muted">
                    {match.position}
                  </span>
                </span>
              </div>

              {/* KDA */}
              <div className="flex flex-col items-center justify-self-center text-center">
                <div className="tabular text-[15px] font-bold leading-none text-fg">
                  {match.kills}
                  <span className="text-[12px] font-light text-muted"> / </span>
                  <span className="text-loss">{match.deaths}</span>
                  <span className="text-[12px] font-light text-muted"> / </span>
                  {match.assists}
                </div>
                <div className="text-[11px] font-bold text-blue sm:text-[12px]">
                  {match.kda.toFixed(2)} KDA
                </div>
              </div>

              {/* stats */}
              <div className="hidden text-[10px] font-medium leading-tight text-muted sm:block">
                <div className="text-[12px] font-bold text-fg">{match.cs} CS</div>
                <div>{match.vision} visión</div>
                <div className="tabular">
                  {formatDuration(match.durationSeconds)}
                </div>
              </div>

              <span
                className={cn(
                  "grid place-items-center text-muted transition-all group-hover:text-fg",
                  open && "rotate-180 text-fg",
                )}
                aria-hidden="true"
              >
                <ChevronDown className="size-4" />
              </span>
            </button>

            <div id={panelId} hidden={!open}>
              <div className="pt-1.5">
                <div className="rounded-md border border-line bg-card px-2 py-2 sm:px-3">
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        match.win ? "text-primary" : "text-loss",
                      )}
                    >
                      {match.win ? "Victoria" : "Derrota"}
                    </span>
                    <span className="text-[11px] font-medium text-muted">
                      {match.queueLabel}
                    </span>
                    <span className="tabular text-[11px] text-muted">
                      {formatDuration(match.durationSeconds)}
                    </span>
                    <span className="text-[11px] text-dim">
                      {time ? `${time.date} · ${time.clock}` : ""}
                    </span>
                    <Link
                      href={detailHref}
                      className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-dim transition-colors hover:text-primary"
                    >
                      <ExternalLink className="size-3" aria-hidden />
                      Abrir partida
                    </Link>
                  </div>

                  {Array.isArray(state) ? (
                    <MatchTeams
                      teams={state}
                      version={version}
                      names={names}
                      mePuuid={rowPuuid}
                      compact
                    />
                  ) : state === "error" ? (
                    <p className="px-1 py-2 text-[11px] leading-relaxed text-muted">
                      No pudimos cargar los jugadores de esta partida.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setTeams((prev) => ({
                            ...prev,
                            [match.matchId]: "loading",
                          }));
                          void loadTeams(match.matchId);
                        }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Reintentar
                      </button>{" "}
                      o{" "}
                      <Link
                        href={detailHref}
                        className="font-semibold text-primary hover:underline"
                      >
                        abrir la partida
                      </Link>
                      .
                    </p>
                  ) : (
                    <div
                      className="space-y-1.5 py-1"
                      role="status"
                      aria-label="Cargando los jugadores de la partida"
                    >
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Cargando los 10 jugadores…
                      </p>
                      {[0, 1, 2].map((row) => (
                        <div
                          key={row}
                          className="h-4 animate-pulse rounded bg-soft/60"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
