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
 * - `worst` mira **todo el historial** (no solo los más jugados: un campeón con
 *   6 partidas al 30% tiene que aparecer aunque haya 20 campeones con más
 *   volumen), exige **mínimo `minWorstGames` partidas** (5), solo admite winrate
 *   **menor a `worstMaxWinrate`** (45%) y ordena por **derrotas**
 *   (volumen × mal winrate): primero lo que más jugaste y peor te sale, no el
 *   0% de dos partidas. Si ganaste, no es un mal pick.
 * - `best` mira los `poolSize` campeones más jugados y exige **muestra
 *   suficiente** (ver `pickSampleFloor`); ordena por `wilsonLowerBound` en vez de
 *   winrate crudo: un 2/3 (67%) queda por debajo de un 12/20 (60%) porque el
 *   intervalo de confianza del 2/3 es enorme. Así no se recomienda un campeón
 *   por haber ganado "esas pocas veces".
 */
export type PickHighlights = {
  best: ChampionStat[];
  worst: ChampionStat[];
};

/** Partidas mínimas para recomendar un pick (`best`). */
const MIN_PICK_GAMES = 5;
/** Techo de la muestra mínima: pedir 200 partidas vaciaría el panel. */
const MAX_PICK_GAMES = 20;
/** La muestra mínima de `best` escala con el campeón más jugado (10%). */
const PICK_SAMPLE_SHARE = 0.1;
/** `worst` solo muestra campeones por debajo de este winrate (0..1). */
export const WORST_MAX_WINRATE = 0.45;
/** Partidas mínimas para marcar un campeón como mal pick. */
export const MIN_WORST_GAMES = 5;

/**
 * Cota inferior del intervalo de Wilson (95%) para una proporción.
 *
 * Es el winrate "con el que te podés comprometer": con muestra chica el
 * intervalo es ancho y la cota baja. `games === 0` devuelve 0.
 */
export function wilsonLowerBound(
  wins: number,
  games: number,
  z = 1.96,
): number {
  if (games <= 0) return 0;
  const p = wins / games;
  const z2 = z * z;
  const denominator = 1 + z2 / games;
  const center = p + z2 / (2 * games);
  const margin = z * Math.sqrt((p * (1 - p)) / games + z2 / (4 * games * games));
  return Math.max(0, (center - margin) / denominator);
}

/**
 * Muestra mínima para entrar en `best`: el 10% del campeón más jugado, entre 5
 * y 20 partidas. Con 200 partidas en Ahri hacen falta 20 con el campeón; con un
 * historial de 20 partidas alcanza con 5.
 */
function pickSampleFloor(mostPlayed: number): number {
  return Math.min(
    MAX_PICK_GAMES,
    Math.max(MIN_PICK_GAMES, Math.ceil(mostPlayed * PICK_SAMPLE_SHARE)),
  );
}

export function pickHighlights(
  champions: readonly ChampionStat[],
  {
    limit = 3,
    poolSize = 8,
    worstMaxWinrate = WORST_MAX_WINRATE,
    minWorstGames = MIN_WORST_GAMES,
  }: {
    limit?: number;
    poolSize?: number;
    worstMaxWinrate?: number;
    minWorstGames?: number;
  } = {},
): PickHighlights {
  const byGames = [...champions].sort(
    (a, b) =>
      b.games - a.games ||
      b.winrate - a.winrate ||
      a.championName.localeCompare(b.championName),
  );
  const pool = byGames.slice(0, Math.max(poolSize, limit));
  if (pool.length === 0) return { best: [], worst: [] };

  const lossesOf = (champion: ChampionStat) => champion.games - champion.wins;

  // `worst` se resuelve primero y sobre TODO el historial: un campeón con 6
  // partidas al 30% no puede quedar afuera por no entrar en el top del pool.
  const worst = byGames
    .filter(
      (champion) =>
        champion.games >= minWorstGames &&
        champion.winrate < worstMaxWinrate,
    )
    .sort(
      (a, b) =>
        lossesOf(b) - lossesOf(a) ||
        a.winrate - b.winrate ||
        b.games - a.games ||
        a.championName.localeCompare(b.championName),
    )
    .slice(0, limit);

  const floor = pickSampleFloor(pool[0]?.games ?? 0);
  const best = pool
    .filter(
      (champion) =>
        champion.games >= floor && champion.winrate >= worstMaxWinrate,
    )
    .sort(
      (a, b) =>
        wilsonLowerBound(b.wins, b.games) -
          wilsonLowerBound(a.wins, a.games) ||
        b.winrate - a.winrate ||
        b.games - a.games ||
        a.championName.localeCompare(b.championName),
    )
    .slice(0, limit);

  return { best, worst };
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
