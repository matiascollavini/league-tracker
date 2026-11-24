import type { Row } from "@libsql/client";
import { db, ensureSchema } from "./client";
import { durationSeconds, participantOf } from "@/lib/riot/aggregate";
import type { Match } from "@/lib/riot/types";

/**
 * Persistencia de partidas.
 *
 * Guardamos las partidas enteras una sola vez y las reusamos entre usuarios:
 * una partida es inmutable. El tamaño es chico (~1,5 KB por partida con los 10
 * participantes) porque solo escribimos los campos que usamos.
 */

const num = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown): string => (value == null ? "" : String(value));

export type Progress = {
  /** Partidas que sabemos que existen (IDs guardados). */
  known: number;
  /** Partidas cuyo detalle ya bajamos. */
  detailed: number;
};

/** Guarda una partida y sus 10 participantes (idempotente). */
export async function saveMatch(
  match: Match,
  platformId: string,
): Promise<void> {
  await ensureSchema();
  const c = db();
  const { matchId } = match.metadata;
  const info = match.info;

  const statements = [
    {
      sql: `INSERT OR REPLACE INTO matches
              (match_id, platform_id, queue_id, game_mode, game_version,
               game_start_ts, game_duration_s, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        matchId,
        platformId,
        info.queueId,
        info.gameMode ?? null,
        info.gameVersion,
        info.gameStartTimestamp ?? info.gameCreation,
        durationSeconds(info),
        Date.now(),
      ],
    },
    {
      sql: "DELETE FROM match_participants WHERE match_id = ?",
      args: [matchId],
    },
    // Al bajar una partida conocemos a sus 10 participantes: los vinculamos a
    // todos, así otro usuario que la comparta no gasta ni un request.
    ...info.participants.map((participant) => ({
      sql: "INSERT OR IGNORE INTO puuid_matches (puuid, match_id) VALUES (?, ?)",
      args: [participant.puuid, matchId],
    })),
    ...info.participants.map((participant) => ({
      sql: `INSERT OR REPLACE INTO match_participants
              (match_id, puuid, champion_id, champion_name, team_id,
               team_position, win, kills, deaths, assists,
               gold_earned, cs, vision_score, damage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        matchId,
        participant.puuid,
        participant.championId,
        participant.championName,
        participant.teamId ?? null,
        participant.teamPosition || participant.individualPosition || null,
        participant.win ? 1 : 0,
        participant.kills ?? 0,
        participant.deaths ?? 0,
        participant.assists ?? 0,
        (participant as { goldEarned?: number }).goldEarned ?? 0,
        (participant.totalMinionsKilled ?? 0) +
          ((participant as { neutralMinionsKilled?: number })
            .neutralMinionsKilled ?? 0),
        participant.visionScore ?? 0,
        (participant as { totalDamageDealtToChampions?: number })
          .totalDamageDealtToChampions ?? 0,
      ],
    })),
  ];

  await c.batch(statements, "write");
}

/** Registra IDs de partida conocidos sin bajar el detalle todavía. */
export async function registerMatchIds(
  puuid: string,
  matchIds: readonly string[],
): Promise<void> {
  if (matchIds.length === 0) return;
  await ensureSchema();
  await db().batch(
    matchIds.map((matchId) => ({
      sql: "INSERT OR IGNORE INTO puuid_matches (puuid, match_id) VALUES (?, ?)",
      args: [puuid, matchId],
    })),
    "write",
  );
}

/** ¿Cuáles de estos IDs ya tienen detalle guardado? */
export async function filterKnownMatchIds(
  matchIds: readonly string[],
): Promise<string[]> {
  if (matchIds.length === 0) return [];
  await ensureSchema();
  const placeholders = matchIds.map(() => "?").join(",");
  const result = await db().execute({
    sql: `SELECT match_id FROM matches WHERE match_id IN (${placeholders})`,
    args: [...matchIds],
  });
  return result.rows.map((row) => str(row.match_id));
}

/** IDs pendientes de detalle, más nuevos primero. */
export async function pendingMatchIds(
  puuid: string,
  limit: number,
): Promise<string[]> {
  if (limit <= 0) return [];
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT pm.match_id
            FROM puuid_matches pm
            LEFT JOIN matches m ON m.match_id = pm.match_id
           WHERE pm.puuid = ? AND m.match_id IS NULL
           ORDER BY pm.match_id DESC
           LIMIT ?`,
    args: [puuid, limit],
  });
  return result.rows.map((row) => str(row.match_id));
}

export async function getProgress(puuid: string): Promise<Progress> {
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT
            (SELECT COUNT(*) FROM puuid_matches WHERE puuid = ?) AS known,
            (SELECT COUNT(*)
               FROM puuid_matches pm
               JOIN matches m ON m.match_id = pm.match_id
              WHERE pm.puuid = ?) AS detailed`,
    args: [puuid, puuid],
  });
  const row = result.rows[0];
  return { known: num(row?.known), detailed: num(row?.detailed) };
}

export type PlayerMatchRow = Record<string, unknown>;

/**
 * Fila de la base -> objeto Match (con solo el participante del jugador).
 * Es pura para poder testearla sin tocar la base.
 */
export function rowToMatch(row: PlayerMatchRow): Match {
  const matchId = str(row.match_id);
  const startedAt = num(row.game_start_ts);
  const duration = num(row.game_duration_s);
  const win = num(row.win) === 1;
  const puuid = str(row.puuid);

  return {
    metadata: { matchId, participants: [puuid] },
    info: {
      gameCreation: startedAt,
      gameStartTimestamp: startedAt,
      gameEndTimestamp: startedAt + duration * 1_000,
      gameDuration: duration,
      gameMode: str(row.game_mode) || undefined,
      gameVersion: str(row.game_version),
      queueId: num(row.queue_id),
      participants: [
        {
          puuid,
          championId: num(row.champion_id),
          championName: str(row.champion_name),
          teamId: row.team_id == null ? undefined : num(row.team_id),
          teamPosition: str(row.team_position) || undefined,
          win,
          kills: num(row.kills),
          deaths: num(row.deaths),
          assists: num(row.assists),
        },
      ],
    },
  };
}

/** Partidas guardadas de un jugador, de la más nueva a la más vieja. */
export async function getPlayerMatches(
  puuid: string,
  limit = 1_000,
): Promise<Match[]> {
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT pm.puuid, m.match_id, m.queue_id, m.game_mode, m.game_version,
                 m.game_start_ts, m.game_duration_s,
                 p.champion_id, p.champion_name, p.team_id, p.team_position,
                 p.win, p.kills, p.deaths, p.assists
            FROM puuid_matches pm
            JOIN matches m ON m.match_id = pm.match_id
            JOIN match_participants p
              ON p.match_id = pm.match_id AND p.puuid = pm.puuid
           WHERE pm.puuid = ?
           ORDER BY m.game_start_ts DESC
           LIMIT ?`,
    args: [puuid, limit],
  });

  const matches: Match[] = [];
  for (const row of result.rows) {
    matches.push(rowToMatch(row as PlayerMatchRow));
  }
  return matches;
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  await ensureSchema();
  const result = await db().execute({
    sql: "SELECT * FROM matches WHERE match_id = ?",
    args: [matchId],
  });
  const row = result.rows[0];
  if (!row) return null;

  const participants = await db().execute({
    sql: "SELECT * FROM match_participants WHERE match_id = ?",
    args: [matchId],
  });

  return {
    metadata: {
      matchId,
      participants: participants.rows.map((p) => str(p.puuid)),
    },
    info: {
      gameCreation: num(row.game_start_ts),
      gameStartTimestamp: num(row.game_start_ts),
      gameEndTimestamp: num(row.game_start_ts) + num(row.game_duration_s) * 1_000,
      gameDuration: num(row.game_duration_s),
      gameMode: str(row.game_mode) || undefined,
      gameVersion: str(row.game_version),
      queueId: num(row.queue_id),
      participants: participants.rows.map((p) => ({
        puuid: str(p.puuid),
        championId: num(p.champion_id),
        championName: str(p.champion_name),
        teamId: p.team_id == null ? undefined : num(p.team_id),
        teamPosition: str(p.team_position) || undefined,
        win: num(p.win) === 1,
        kills: num(p.kills),
        deaths: num(p.deaths),
        assists: num(p.assists),
      })),
    },
  };
}

export type SyncState = {
  puuid: string;
  platformId: string;
  lastSyncedAt: number | null;
  idsCursor: number;
  backfillState: "none" | "running" | "done" | "partial";
  lockedUntil: number | null;
};

export async function getSyncState(
  puuid: string,
): Promise<SyncState | null> {
  await ensureSchema();
  const result = await db().execute({
    sql: "SELECT * FROM puuid_sync WHERE puuid = ?",
    args: [puuid],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    puuid: str(row.puuid),
    platformId: str(row.platform_id),
    lastSyncedAt: row.last_synced_at == null ? null : num(row.last_synced_at),
    idsCursor: num(row.ids_cursor),
    backfillState: (str(row.backfill_state) || "none") as SyncState["backfillState"],
    lockedUntil: row.locked_until == null ? null : num(row.locked_until),
  };
}

export async function touchSyncState(
  puuid: string,
  platformId: string,
  values: {
    gameName?: string;
    tagLine?: string;
    idsCursor?: number;
    backfillState?: SyncState["backfillState"];
    lastSyncedAt?: number;
  },
): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `INSERT INTO puuid_sync
            (puuid, platform_id, game_name, tag_line, last_synced_at,
             ids_cursor, backfill_state)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET
            platform_id    = excluded.platform_id,
            game_name      = COALESCE(excluded.game_name, puuid_sync.game_name),
            tag_line       = COALESCE(excluded.tag_line, puuid_sync.tag_line),
            last_synced_at = COALESCE(excluded.last_synced_at, puuid_sync.last_synced_at),
            ids_cursor     = MAX(excluded.ids_cursor, puuid_sync.ids_cursor),
            backfill_state = excluded.backfill_state`,
    args: [
      puuid,
      platformId,
      values.gameName ?? null,
      values.tagLine ?? null,
      values.lastSyncedAt ?? null,
      values.idsCursor ?? 0,
      values.backfillState ?? "none",
    ],
  });
}

/**
 * Lock cooperativo: evita que dos procesos sincronicen al mismo jugador a la
 * vez. Devuelve un token que identifica al dueño, o null si ya está tomado.
 */
export async function tryLockSync(
  puuid: string,
  platformId: string,
  seconds = 120,
): Promise<string | null> {
  await ensureSchema();
  const now = Date.now();
  const token = crypto.randomUUID();

  await db().execute({
    sql: `INSERT INTO puuid_sync (puuid, platform_id, locked_until, locked_by)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET
            locked_until = excluded.locked_until,
            locked_by    = excluded.locked_by
          WHERE puuid_sync.locked_until IS NULL OR puuid_sync.locked_until < ?`,
    args: [puuid, platformId, now + seconds * 1_000, token, now],
  });

  const result = await db().execute({
    sql: "SELECT locked_by, locked_until FROM puuid_sync WHERE puuid = ?",
    args: [puuid],
  });
  const row = result.rows[0];
  const owned =
    row != null && str(row.locked_by) === token && num(row.locked_until) > now;
  return owned ? token : null;
}

/** Suelta el lock solo si sigue siendo nuestro. */
export async function unlockSync(puuid: string, token: string): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: "UPDATE puuid_sync SET locked_until = NULL, locked_by = NULL WHERE puuid = ? AND locked_by = ?",
    args: [puuid, token],
  });
}

export async function totalMatchesInDb(): Promise<number> {
  await ensureSchema();
  const result = await db().execute("SELECT COUNT(*) AS n FROM matches");
  return num(result.rows[0]?.n);
}

/** Helper para tests: borra todo el contenido (no las tablas). */
export async function resetDbForTests(): Promise<void> {
  await ensureSchema();
  const c = db();
  for (const table of [
    "match_participants",
    "puuid_matches",
    "matches",
    "puuid_sync",
  ]) {
    await c.execute(`DELETE FROM ${table}`);
  }
}

export { participantOf };
