import { roleOrderIndex } from "./aggregate";
import type { Participant } from "./types";

/**
 * Vista compacta de una partida: los 10 jugadores agrupados por equipo.
 *
 * Es lo que se muestra al desplegar una fila de "Últimas partidas" (vía
 * `/api/partida/[matchId]`) y también lo que usa la página de detalle. Solo
 * números y strings: se puede mandar a un client component sin arrastrar el
 * payload crudo de Riot.
 */

export type PanelPlayer = {
  puuid: string;
  /** "Nombre#TAG" tal como lo reportó Riot. null si no vino. */
  riotId: string | null;
  championName: string;
  teamId: number;
  /** Posición cruda de Riot (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY) o null. */
  position: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  vision: number;
  damage: number;
};

export type PanelTeam = {
  teamId: number;
  win: boolean;
  /** Ordenados por línea (TOP → SUPPORT). */
  players: PanelPlayer[];
};

const ROLE_LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungla",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

/** Posición cruda de Riot -> etiqueta corta. Desconocida = "—". */
export function roleLabel(raw: string | null | undefined): string {
  return (raw && ROLE_LABEL[raw]) || "—";
}

/** Participante crudo de Riot (match-v5) -> fila del panel. */
export function toPanelPlayer(participant: Participant): PanelPlayer {
  const riotId = participant.riotIdGameName
    ? `${participant.riotIdGameName}#${participant.riotIdTagline ?? ""}`
    : null;

  return {
    puuid: participant.puuid,
    riotId,
    championName: participant.championName,
    teamId: participant.teamId ?? 0,
    position:
      participant.teamPosition || participant.individualPosition || null,
    win: participant.win,
    kills: participant.kills ?? 0,
    deaths: participant.deaths ?? 0,
    assists: participant.assists ?? 0,
    cs:
      (participant.totalMinionsKilled ?? 0) +
      (participant.neutralMinionsKilled ?? 0),
    gold: participant.goldEarned ?? 0,
    vision: participant.visionScore ?? 0,
    damage: participant.totalDamageDealtToChampions ?? 0,
  };
}

/** Agrupa por equipo (azul 100 primero) y ordena cada equipo por línea. */
export function groupTeams(players: readonly PanelPlayer[]): PanelTeam[] {
  const byTeam = new Map<number, PanelPlayer[]>();

  for (const player of players) {
    const list = byTeam.get(player.teamId);
    if (list) list.push(player);
    else byTeam.set(player.teamId, [player]);
  }

  return [...byTeam.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([teamId, list]) => ({
      teamId,
      win: list[0]?.win ?? false,
      players: [...list].sort(
        (a, b) => roleOrderIndex(a.position) - roleOrderIndex(b.position),
      ),
    }));
}

/**
 * Respuesta de `/api/partida/[matchId]`: `{ teams: PanelTeam[] }`.
 *
 * El endpoint es nuestro, pero la respuesta viaja por el borde igual: si algo
 * cambió o el body llegó vacío, se descarta y la fila muestra el error en vez
 * de romperse con un TypeError al renderizar.
 */
export function parsePanelTeams(value: unknown): PanelTeam[] | null {
  if (!value || typeof value !== "object") return null;
  const teams = (value as { teams?: unknown }).teams;
  if (!Array.isArray(teams) || teams.length === 0) return null;

  const ok = teams.every((team) => {
    if (!team || typeof team !== "object") return false;
    const candidate = team as { teamId?: unknown; win?: unknown; players?: unknown };
    return (
      typeof candidate.teamId === "number" &&
      typeof candidate.win === "boolean" &&
      Array.isArray(candidate.players) &&
      candidate.players.length > 0 &&
      candidate.players.every(
        (player) =>
          player &&
          typeof player === "object" &&
          typeof (player as { puuid?: unknown }).puuid === "string" &&
          typeof (player as { championName?: unknown }).championName === "string",
      )
    );
  });

  return ok ? (teams as PanelTeam[]) : null;
}
