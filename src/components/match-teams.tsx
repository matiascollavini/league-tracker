import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon/champions";
import { kdaOf } from "@/lib/riot/aggregate";
import { roleLabel, type PanelTeam } from "@/lib/riot/panel";
import { cn } from "@/lib/utils";

type Props = {
  teams: PanelTeam[];
  /** Versión de Data Dragon para los iconos. */
  version: string;
  /** championName de Riot -> nombre localizado de Data Dragon. */
  names: Record<string, string>;
  /** Puuid del jugador del perfil: se resalta su fila. */
  mePuuid?: string | null;
  /** Versión apretada, para el desplegable de la lista de partidas. */
  compact?: boolean;
};

/**
 * Los dos equipos de una partida, con la tabla de participantes.
 *
 * Sin hooks ni APIs de server: lo usan tanto la página de detalle (server)
 * como el desplegable de "Últimas partidas" (client).
 */
export function MatchTeams({
  teams,
  version,
  names,
  mePuuid,
  compact = false,
}: Props) {
  return (
    <div className={compact ? "space-y-2" : "space-y-5"}>
      {teams.map((team) => (
        <section
          key={team.teamId}
          className={cn(
            "overflow-hidden",
            compact
              ? "rounded border border-line/80 bg-shade/40"
              : "panel",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between border-b border-line/70",
              compact ? "px-2 py-1" : "px-3 py-2",
            )}
          >
            <h3 className={compact ? "label" : "section-title"}>
              {team.teamId === 100 ? "Equipo azul" : "Equipo rojo"}
            </h3>
            <span
              className={cn(
                "font-bold uppercase tracking-wide",
                compact ? "text-[9px]" : "text-[10px]",
                team.win ? "text-primary" : "text-loss",
              )}
            >
              {team.win ? "Victoria" : "Derrota"}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr
                className={cn(
                  "font-bold uppercase tracking-wider text-dim",
                  compact ? "text-[9px]" : "text-[10px]",
                )}
              >
                <th className="px-2 py-1 text-left font-medium sm:px-3">
                  Jugador
                </th>
                <th className="px-1 py-1 text-right font-medium sm:px-2">
                  KDA
                </th>
                <th className="hidden px-1 py-1 text-right font-medium sm:table-cell sm:px-2">
                  CS
                </th>
                <th className="hidden px-1 py-1 text-right font-medium sm:table-cell sm:px-2">
                  Oro
                </th>
                <th className="hidden px-1 py-1 text-right font-medium sm:table-cell sm:px-2">
                  Visión
                </th>
                <th className="px-2 py-1 text-right font-medium sm:px-3">
                  Daño
                </th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((player) => {
                const isMe = mePuuid !== undefined && player.puuid === mePuuid;
                const role = roleLabel(player.position);
                return (
                  <tr
                    key={player.puuid}
                    className={cn(
                      "border-t border-line/60",
                      isMe && "bg-primary/8",
                    )}
                  >
                    <td className={compact ? "px-2 py-1" : "px-3 py-1.5"}>
                      <div className="flex min-w-0 items-center gap-2">
                        <Image
                          src={championIconUrl(version, player.championName)}
                          alt=""
                          width={28}
                          height={28}
                          className={cn(
                            "shrink-0 rounded-sm bg-soft",
                            compact ? "size-6" : "size-7",
                          )}
                        />
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate font-semibold",
                              compact ? "text-[11px]" : "text-[12px]",
                              isMe ? "text-primary" : "text-fg",
                            )}
                          >
                            {player.riotId ?? "Jugador"}
                            {isMe ? (
                              <span className="ml-1 text-[9px] font-bold uppercase text-primary">
                                vos
                              </span>
                            ) : null}
                          </p>
                          <p
                            className={cn(
                              "truncate text-muted",
                              compact ? "text-[10px]" : "text-[11px]",
                            )}
                          >
                            {names[player.championName] ?? player.championName}
                            {role !== "—" ? ` · ${role}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap text-right tabular font-bold text-fg",
                        compact ? "px-1 py-1 text-[11px] sm:px-2" : "px-2 py-1.5 text-[12px]",
                      )}
                    >
                      {player.kills}/{player.deaths}/{player.assists}
                      <span className="ml-1 hidden text-[11px] text-muted sm:inline">
                        {kdaOf(player.kills, player.deaths, player.assists).toFixed(1)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "hidden text-right tabular text-muted sm:table-cell",
                        compact ? "px-1 py-1 text-[11px] sm:px-2" : "px-2 py-1.5",
                      )}
                    >
                      {player.cs}
                    </td>
                    <td
                      className={cn(
                        "hidden text-right tabular text-muted sm:table-cell",
                        compact ? "px-1 py-1 text-[11px] sm:px-2" : "px-2 py-1.5",
                      )}
                    >
                      {(player.gold / 1000).toFixed(1)}k
                    </td>
                    <td
                      className={cn(
                        "hidden text-right tabular text-muted sm:table-cell",
                        compact ? "px-1 py-1 text-[11px] sm:px-2" : "px-2 py-1.5",
                      )}
                    >
                      {player.vision}
                    </td>
                    <td
                      className={cn(
                        "text-right tabular text-muted",
                        compact ? "px-2 py-1 text-[11px] sm:px-3" : "px-3 py-1.5",
                      )}
                    >
                      {(player.damage / 1000).toFixed(1)}k
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
