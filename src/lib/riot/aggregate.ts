import type { Match, MatchInfo, Participant } from "./types";
import { CUSTOM_QUEUE_ID, queueLabel } from "./config";

/**
 * Agregación por campeón. Funciones puras: fáciles de testear y de reusar
 * cuando el ingest escriba en Postgres.
 *
 * Regla del proyecto (docs/API-LOL.txt §8.1): agrupar SIEMPRE por championName.
 * championId no es confiable en partidas anteriores al patch 11.4.
 */

export type ChampionStat = {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winrate: number;
  /** KDA promedio del campeón (totales, no el de la última partida). */
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
};

export type PlayerSummary = {
  matches: number;
  wins: number;
  losses: number;
  winrate: number;
  kda: number;
  champions: ChampionStat[];
  /** Rango de fechas analizado (epoch ms), null si no hay partidas. */
  from: number | null;
  to: number | null;
  customExcluded: number;
};

export type MatchSummary = {
  matchId: string;
  /** Puuid con el que el jugador aparece en ESTA partida (puede ser el viejo). */
  puuid: string;
  playedAt: number;
  championId: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  queueId: number;
  queueLabel: string;
  durationSeconds: number;
  position: string;
  /**
   * Rol de la partida: TOP, JUNGLE, MIDDLE, BOTTOM o UTILITY. Vacío cuando el
   * modo no tiene posiciones fijas (ARAM, Arena, custom): Riot manda "Invalid"
   * o "" y eso no es un rol.
   */
  role: string;
  cs: number;
  gold: number;
  vision: number;
};

const ZERO = 0;

/** Un jugador puede tener varios puuids (Riot los reasigna): se busca en todos. */
export type PuuidArg = string | readonly string[];

function puuidList(value: PuuidArg): readonly string[] {
  return typeof value === "string" ? [value] : value;
}

export function participantOf(
  match: Match,
  puuid: PuuidArg,
): Participant | undefined {
  const ids = puuidList(puuid);
  return match.info.participants.find((p) => ids.includes(p.puuid));
}

/**
 * gameDuration cambió de milisegundos a segundos en el patch 11.20.
 * Regla oficial: si existe gameEndTimestamp, ya está en segundos.
 */
export function durationSeconds(info: MatchInfo): number {
  const raw = info.gameDuration ?? ZERO;
  if (info.gameEndTimestamp != null) return raw;
  return Math.round(raw / 1_000);
}

/** "16.23.541.1234" -> "16.23" */
export function patchOf(gameVersion: string): string {
  return gameVersion.split(".").slice(0, 2).join(".");
}

export function isCustomQueue(queueId: number): boolean {
  return queueId === CUSTOM_QUEUE_ID;
}

export function kdaOf(kills: number, deaths: number, assists: number): number {
  return deaths === 0 ? kills + assists : (kills + assists) / deaths;
}

export function summarize(
  matches: readonly Match[],
  puuid: PuuidArg,
  options: { excludeCustoms?: boolean } = {},
): PlayerSummary {
  const { excludeCustoms = true } = options;

  const byChampion = new Map<string, ChampionStat>();
  let played = 0;
  let wins = 0;
  let customExcluded = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let from: number | null = null;
  let to: number | null = null;

  for (const match of matches) {
    if (excludeCustoms && isCustomQueue(match.info.queueId)) {
      customExcluded += 1;
      continue;
    }

    const participant = participantOf(match, puuid);
    if (!participant) continue;

    played += 1;
    if (participant.win) wins += 1;
    kills += participant.kills ?? ZERO;
    deaths += participant.deaths ?? ZERO;
    assists += participant.assists ?? ZERO;

    const startedAt = match.info.gameStartTimestamp ?? match.info.gameCreation;
    from = from === null ? startedAt : Math.min(from, startedAt);
    to = to === null ? startedAt : Math.max(to, startedAt);

    const key = participant.championName;
    const current = byChampion.get(key) ?? {
      championId: participant.championId,
      championName: key,
      games: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
      kda: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };

    current.games += 1;
    if (participant.win) current.wins += 1;
    current.losses = current.games - current.wins;
    current.winrate = current.wins / current.games;
    current.kills += participant.kills ?? ZERO;
    current.deaths += participant.deaths ?? ZERO;
    current.assists += participant.assists ?? ZERO;
    byChampion.set(key, current);
  }

  // KDA promedio se calcula con los totales de todas las partidas del campeón.
  for (const champion of byChampion.values()) {
    champion.kda = kdaOf(champion.kills, champion.deaths, champion.assists);
  }

  const champions = [...byChampion.values()].sort(
    (a, b) =>
      b.games - a.games ||
      b.winrate - a.winrate ||
      a.championName.localeCompare(b.championName),
  );

  return {
    matches: played,
    wins,
    losses: played - wins,
    winrate: played > 0 ? wins / played : 0,
    kda: kdaOf(kills, deaths, assists),
    champions,
    from,
    to,
    customExcluded,
  };
}

/**
 * Picks destacados del perfil: los mejores y los que conviene dejar.
 *
 * Solo se miran los campeones más jugados (`poolSize`), así una partida suelta
 * con 0% u 100% de winrate no se cuela como "mejor" ni "peor" pick. Dentro de
 * ese grupo, `best` ordena por winrate descendente y `worst` por ascendente.
 * Los dos listados no se repiten: si hay pocos campeones el grupo se parte.
 */
export type PickHighlights = {
  best: ChampionStat[];
  worst: ChampionStat[];
};

export function pickHighlights(
  champions: readonly ChampionStat[],
  { limit = 3, poolSize = 8 }: { limit?: number; poolSize?: number } = {},
): PickHighlights {
  const byGames = [...champions].sort(
    (a, b) =>
      b.games - a.games ||
      b.winrate - a.winrate ||
      a.championName.localeCompare(b.championName),
  );
  const pool = byGames.slice(0, Math.max(poolSize, limit));

  const byBest = [...pool].sort(
    (a, b) =>
      b.winrate - a.winrate ||
      b.games - a.games ||
      a.championName.localeCompare(b.championName),
  );
  const byWorst = [...pool].sort(
    (a, b) =>
      a.winrate - b.winrate ||
      b.games - a.games ||
      a.championName.localeCompare(b.championName),
  );

  // Con 6+ candidatos alcanza para dos listas de 3; con menos se reparte.
  const bestCount = pool.length >= limit * 2 ? limit : Math.ceil(pool.length / 2);
  const best = byBest.slice(0, bestCount);
  const taken = new Set(best.map((champion) => champion.championName));

  return {
    best,
    // Se excluyen los de `best` para no recomendar y desaconsejar el mismo pick.
    worst: byWorst
      .filter((champion) => !taken.has(champion.championName))
      .slice(0, limit),
  };
}

export function toMatchSummaries(
  matches: readonly Match[],
  puuid: PuuidArg,
): MatchSummary[] {
  const out: MatchSummary[] = [];

  for (const match of matches) {
    const participant = participantOf(match, puuid);
    if (!participant) continue;

    const kills = participant.kills ?? ZERO;
    const deaths = participant.deaths ?? ZERO;
    const assists = participant.assists ?? ZERO;

    out.push({
      matchId: match.metadata.matchId,
      puuid: participant.puuid,
      playedAt: match.info.gameStartTimestamp ?? match.info.gameCreation,
      championId: participant.championId,
      championName: participant.championName,
      win: participant.win,
      kills,
      deaths,
      assists,
      kda: kdaOf(kills, deaths, assists),
      queueId: match.info.queueId,
      queueLabel: queueLabel(match.info.queueId),
      durationSeconds: durationSeconds(match.info),
      position: normalizePosition(participant),
      role: normalizeRole(
        participant.teamPosition || participant.individualPosition || "",
      ),
      cs:
        (participant.totalMinionsKilled ?? ZERO) +
        ((participant as { neutralMinionsKilled?: number }).neutralMinionsKilled ??
          ZERO),
      gold: participant.goldEarned ?? ZERO,
      vision: participant.visionScore ?? ZERO,
    });
  }

  return out.sort((a, b) => b.playedAt - a.playedAt);
}

/** Roles con posición fija. Lo demás ("Invalid", "", "NONE") no se cuenta. */
export const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

export function normalizeRole(raw: string): string {
  return (ROLES as readonly string[]).includes(raw) ? raw : "";
}

const ROLE_ORDER: Record<string, number> = {
  TOP: 0,
  JUNGLE: 1,
  MIDDLE: 2,
  BOTTOM: 3,
  UTILITY: 4,
};

/**
 * Índice de orden por línea (TOP → SUPPORT). Los roles desconocidos
 * ("Invalid", "NONE", vacío) van al final para no romper la tabla.
 */
export function roleOrderIndex(raw: string | null | undefined): number {
  return raw && ROLE_ORDER[raw] !== undefined ? ROLE_ORDER[raw] : ROLES.length;
}

export function normalizePosition(participant: Participant): string {
  const raw = participant.teamPosition || participant.individualPosition || "";
  switch (raw) {
    case "TOP":
      return "Top";
    case "JUNGLE":
      return "Jungla";
    case "MIDDLE":
      return "Mid";
    case "BOTTOM":
      return "ADC";
    case "UTILITY":
      return "Support";
    default:
      return "—";
  }
}

/** "hace 3 h", "hace 2 d" */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? "" : "es"}`;
}

/**
 * Zona horaria con la que se muestran horas y fechas.
 *
 * Se fija explícitamente (no se usa la del server) porque la lista de partidas
 * es un client component: si el server formatea en UTC y el navegador en la
 * zona del usuario, React detecta una diferencia de texto al hidratar.
 */
export const DISPLAY_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Hora de la partida en formato 24 h ("19:45"). */
export function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(timestamp));
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(timestamp));
}

/**
 * Hora, "hace cuánto" y fecha de una partida, tal como las muestra la lista.
 *
 * Se arman en el server porque `timeAgo` depende de "ahora": si lo calculara el
 * navegador, el texto cambiaría entre el HTML del server y la hidratación.
 */
export type MatchTimes = { clock: string; ago: string; date: string };

export function matchTimes(playedAt: number): MatchTimes {
  return {
    clock: formatClock(playedAt),
    ago: timeAgo(playedAt),
    date: formatDate(playedAt),
  };
}
