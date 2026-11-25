import type { Row } from "@libsql/client";
import { isPlatform, type Platform } from "@/lib/riot/config";
import { db, ensureSchema } from "./client";
import { accountUpsertStatement } from "./accounts";
import { durationSeconds, participantOf } from "@/lib/riot/aggregate";
import type { Match } from "@/lib/riot/types";

/**
 * Persistencia de partidas.
 *
 * Guardamos las partidas enteras una sola vez y las reusamos entre usuarios:
 * una partida es inmutable. El tamaño es chico (~1,5 KB por partida con los 10
 * participantes) porque solo escribimos los campos que usamos.
 */

/**
 * Un jugador puede tener VARIOS puuids: Riot los reasigna (keke#6seve tiene
 * partidas con dos). Las lecturas aceptan uno o varios y suman como si fueran
 * el mismo: si no, el perfil muestra un subconjunto y el progreso nunca cierra.
 */
type PuuidArg = string | readonly string[];

function puuidList(value: PuuidArg): string[] {
  return typeof value === "string" ? [value] : [...value];
}

const inClause = (count: number): string =>
  Array.from({ length: count }, () => "?").join(",");

/**
 * Todos los puuids que son la misma persona.
 *
 * Dos fuentes, en la misma query: las filas de `puuid_sync` con el mismo Riot ID
 * y los `riot_id` que quedaron guardados en las partidas. La segunda es la que
 * salva el caso real: `account-v1` puede devolver un puuid viejo (o estar
 * cacheado) mientras las partidas ya tienen el nuevo, y así y todo se juntan.
 */
export async function getAliasPuuids(
  puuid: string,
  riotId?: { gameName: string | null; tagLine: string | null },
): Promise<string[]> {
  const state = await getSyncState(puuid);
  const gameName = riotId?.gameName ?? state?.gameName ?? null;
  const tagLine = riotId?.tagLine ?? state?.tagLine ?? null;

  const aliases = new Set<string>([puuid]);
  if (!gameName || !tagLine) return [...aliases];

  const result = await db().execute({
    sql: `SELECT puuid FROM puuid_sync
           WHERE game_name = ? COLLATE NOCASE AND tag_line = ? COLLATE NOCASE
          UNION
          SELECT puuid FROM match_participants
           WHERE riot_id = ? COLLATE NOCASE`,
    args: [gameName, tagLine, `${gameName}#${tagLine}`],
  });

  for (const row of result.rows) aliases.add(str(row.puuid));
  return [...aliases];
}

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
              (match_id, puuid, champion_id, champion_name, riot_id,
               profile_icon, summoner_level, team_id,
               team_position, win, kills, deaths, assists,
               gold_earned, cs, vision_score, damage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        matchId,
        participant.puuid,
        participant.championId,
        participant.championName,
        participant.riotIdGameName
          ? `${participant.riotIdGameName}#${participant.riotIdTagline ?? ""}`
          : null,
        participant.profileIcon ?? null,
        participant.summonerLevel ?? null,
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

  // Los 10 participantes también alimentan el índice del buscador del header
  // (ADR-014). Va en el mismo batch: no cuesta un viaje extra a la base.
  const startTs = info.gameStartTimestamp ?? info.gameCreation;
  for (const participant of info.participants) {
    if (!participant.riotIdGameName || !participant.riotIdTagline) continue;
    statements.push(
      accountUpsertStatement({
        puuid: participant.puuid,
        platformId,
        gameName: participant.riotIdGameName,
        tagLine: participant.riotIdTagline,
        profileIcon: participant.profileIcon ?? null,
        level: participant.summonerLevel ?? null,
        lastSeenTs: startTs,
      }),
    );
  }

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

/**
 * Saca una partida de la cola de un jugador.
 *
 * Se usa cuando Riot devuelve 404/400 para esa partida (la retención la borró o
 * el ID está roto): si no, `pendingMatchIds` la devuelve siempre primera y
 * ninguna corrida vuelve a avanzar. No borra la partida ni los vínculos de
 * otros jugadores, solo el de este puuid.
 */
export async function forgetMatchId(
  puuid: string,
  matchId: string,
): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: "DELETE FROM puuid_matches WHERE puuid = ? AND match_id = ?",
    args: [puuid, matchId],
  });
}

/** IDs pendientes de detalle, más nuevos primero. */
export async function pendingMatchIds(
  puuid: PuuidArg,
  limit: number,
): Promise<string[]> {
  if (limit <= 0) return [];
  await ensureSchema();
  const ids = puuidList(puuid);
  const inSql = inClause(ids.length);
  const result = await db().execute({
    sql: `SELECT DISTINCT pm.match_id
            FROM puuid_matches pm
           WHERE pm.puuid IN (${inSql})
             AND NOT EXISTS (
                   SELECT 1
                     FROM matches m
                     JOIN match_participants p
                       ON p.match_id = m.match_id AND p.puuid IN (${inSql})
                    WHERE m.match_id = pm.match_id
                 )
           ORDER BY pm.match_id DESC
           LIMIT ?`,
    // Un link cuenta como "con detalle" solo si el jugador aparece de verdad en
    // la partida guardada; si no, se vuelve a pedir (y si Riot tampoco lo trae,
    // el ingest descarta el link para no trabar la cola).
    args: [...ids, ...ids, limit],
  });
  return result.rows.map((row) => str(row.match_id));
}

export async function getProgress(puuid: PuuidArg): Promise<Progress> {
  await ensureSchema();
  const ids = puuidList(puuid);
  const inSql = inClause(ids.length);
  const result = await db().execute({
    sql: `SELECT
            (SELECT COUNT(DISTINCT match_id) FROM puuid_matches
              WHERE puuid IN (${inSql})) AS known,
            (SELECT COUNT(DISTINCT pm.match_id)
               FROM puuid_matches pm
               JOIN matches m ON m.match_id = pm.match_id
               JOIN match_participants p
                 ON p.match_id = pm.match_id AND p.puuid IN (${inSql})
              WHERE pm.puuid IN (${inSql})) AS detailed`,
    args: [...ids, ...ids, ...ids],
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
          goldEarned: num(row.gold_earned),
          totalMinionsKilled: num(row.cs),
          visionScore: num(row.vision_score),
          totalDamageDealtToChampions: num(row.damage),
          profileIcon: row.profile_icon == null ? undefined : num(row.profile_icon),
          summonerLevel: row.summoner_level == null ? undefined : num(row.summoner_level),
        },
      ],
    },
  };
}

/**
 * Partidas + progreso en UNA sola consulta (importante en Turso: cada query es
 * un viaje de red). Devuelve también cuántas partidas conocidas hay en total.
 */
export async function getPlayerMatchesWithProgress(
  puuid: PuuidArg,
  limit = 1_000,
): Promise<{
  matches: Match[];
  progress: Progress;
  queued: boolean;
  /** Estado del backfill: 'done' significa que ya se recorrió todo el historial. */
  backfillState: SyncState["backfillState"];
}> {
  await ensureSchema();
  const ids = puuidList(puuid);
  const inSql = inClause(ids.length);
  const result = await db().execute({
    // El participante se busca por CUALQUIERA de los puuids del jugador y se
    // agrupa por partida: la misma partida puede estar linkeada con dos puuids
    // suyos (Riot los reasigna) y se mostraría dos veces.
    sql: `SELECT p.puuid, m.match_id, m.queue_id, m.game_mode, m.game_version,
                 m.game_start_ts, m.game_duration_s,
                 p.champion_id, p.champion_name, p.team_id, p.team_position,
                 p.win, p.kills, p.deaths, p.assists,
                 p.cs, p.gold_earned, p.vision_score, p.damage,
                 p.profile_icon, p.summoner_level,
                 (SELECT COUNT(DISTINCT pm2.match_id) FROM puuid_matches pm2
                   WHERE pm2.puuid IN (${inSql})) AS known_total,
                 EXISTS (SELECT 1 FROM puuid_sync ps
                          WHERE ps.puuid IN (${inSql})) AS queued,
                 COALESCE((SELECT ps.backfill_state FROM puuid_sync ps
                            WHERE ps.puuid IN (${inSql})
                            ORDER BY CASE ps.backfill_state
                                       WHEN 'done' THEN 0 ELSE 1 END
                            LIMIT 1), 'none') AS backfill_state
            FROM puuid_matches pm
            JOIN matches m ON m.match_id = pm.match_id
            JOIN match_participants p
              ON p.match_id = pm.match_id AND p.puuid IN (${inSql})
           WHERE pm.puuid IN (${inSql})
           GROUP BY pm.match_id
           ORDER BY m.game_start_ts DESC
           LIMIT ?`,
    // Un juego de args por cada `IN` + el LIMIT final, en orden de aparición.
    args: [...ids, ...ids, ...ids, ...ids, ...ids, limit],
  });

  const matches: Match[] = [];
  let known = 0;
  // Sin filas no hay a quién preguntar: el jugador se sincroniza igual porque
  // no tiene ninguna partida guardada.
  let queued = false;
  let backfillState: SyncState["backfillState"] = "none";
  for (const row of result.rows) {
    matches.push(rowToMatch(row as PlayerMatchRow));
    known = num(row.known_total);
    queued = num(row.queued) === 1;
    backfillState = (str(row.backfill_state) || "none") as SyncState["backfillState"];
  }

  return {
    matches,
    progress: { known: Math.max(known, matches.length), detailed: matches.length },
    queued,
    backfillState,
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
                 p.win, p.kills, p.deaths, p.assists,
                 p.cs, p.gold_earned, p.vision_score, p.damage
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
  /** Riot ID con el que se guardó este puuid (sirve para unir alias). */
  gameName: string | null;
  tagLine: string | null;
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
    gameName: row.game_name == null ? null : str(row.game_name),
    tagLine: row.tag_line == null ? null : str(row.tag_line),
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

  const baseArgs = [
    puuid,
    platformId,
    values.gameName ?? null,
    values.tagLine ?? null,
    values.lastSyncedAt ?? null,
    values.idsCursor ?? 0,
  ];

  // Sin backfillState se actualiza solo el resto: NUNCA pisar el estado
  // (antes se sobreescribía un 'done' con 'none' y el jugador volvía a la cola).
  const sql =
    values.backfillState === undefined
      ? `INSERT INTO puuid_sync
           (puuid, platform_id, game_name, tag_line, last_synced_at, ids_cursor)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(puuid) DO UPDATE SET
           platform_id    = excluded.platform_id,
           game_name      = COALESCE(excluded.game_name, puuid_sync.game_name),
           tag_line       = COALESCE(excluded.tag_line, puuid_sync.tag_line),
           last_synced_at = COALESCE(excluded.last_synced_at, puuid_sync.last_synced_at),
           ids_cursor     = MAX(excluded.ids_cursor, puuid_sync.ids_cursor)`
      : `INSERT INTO puuid_sync
           (puuid, platform_id, game_name, tag_line, last_synced_at,
            ids_cursor, backfill_state)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(puuid) DO UPDATE SET
           platform_id    = excluded.platform_id,
           game_name      = COALESCE(excluded.game_name, puuid_sync.game_name),
           tag_line       = COALESCE(excluded.tag_line, puuid_sync.tag_line),
           last_synced_at = COALESCE(excluded.last_synced_at, puuid_sync.last_synced_at),
           ids_cursor     = MAX(excluded.ids_cursor, puuid_sync.ids_cursor),
           backfill_state = excluded.backfill_state`;

  const args =
    values.backfillState === undefined
      ? baseArgs
      : [...baseArgs, values.backfillState];

  await db().execute({ sql, args });
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

/** Foto del rango: si Riot no responde, mostramos la última conocida. */
export async function saveLeagueSnapshot(
  puuid: string,
  platform: Platform,
  entries: unknown,
): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `INSERT OR REPLACE INTO league_snapshots
            (puuid, platform_id, payload, updated_at)
          VALUES (?, ?, ?, ?)`,
    args: [puuid, platform, JSON.stringify(entries), Date.now()],
  });
}

export async function getLeagueSnapshot(
  puuid: string,
): Promise<{ entries: unknown[]; updatedAt: number } | null> {
  await ensureSchema();
  const result = await db().execute({
    sql: "SELECT payload, updated_at FROM league_snapshots WHERE puuid = ?",
    args: [puuid],
  });
  const row = result.rows[0];
  if (!row) return null;
  try {
    const parsed: unknown = JSON.parse(str(row.payload));
    return {
      entries: Array.isArray(parsed) ? parsed : [],
      updatedAt: num(row.updated_at),
    };
  } catch {
    return null;
  }
}

export type SyncOwner = {
  puuid: string;
  platform: Platform;
  gameName: string | null;
  tagLine: string | null;
};

/**
 * ¿Ya conocemos este puuid? El puuid es la identidad; la plataforma es solo
 * metadata. Así, buscar una cuenta de LAS eligiendo LAN igual encuentra los
 * datos guardados.
 */
export async function findSyncForPuuid(
  puuid: string,
): Promise<SyncOwner | null> {
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT ps.puuid, ps.platform_id, ps.game_name, ps.tag_line
            FROM puuid_sync ps
           WHERE ps.puuid = ?
             AND EXISTS (
               SELECT 1
                 FROM puuid_matches pm
                 JOIN match_participants p
                   ON p.match_id = pm.match_id AND p.puuid = pm.puuid
                WHERE pm.puuid = ps.puuid
             )
           LIMIT 1`,
    args: [puuid],
  });
  const row = result.rows[0];
  if (!row) return null;
  const platform = str(row.platform_id);
  if (!isPlatform(platform)) return null;
  return {
    puuid: str(row.puuid),
    platform,
    gameName: row.game_name == null ? null : str(row.game_name),
    tagLine: row.tag_line == null ? null : str(row.tag_line),
  };
}

/**
 * Busca el puuid que YA tiene datos para un Riot ID.
 *
 * Sirve de red de seguridad: si Riot devuelve un puuid distinto (o inválido)
 * para una cuenta que ya conocemos, seguimos usando el que funciona en vez de
 * mostrar la vía directa y perder las ~1.000 partidas analizadas.
 */
export async function findSyncedPuuid(
  gameName: string,
  tagLine: string,
): Promise<SyncOwner | null> {
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT ps.puuid, ps.platform_id, ps.game_name, ps.tag_line
            FROM puuid_sync ps
           WHERE ps.game_name = ? COLLATE NOCASE
             AND ps.tag_line = ? COLLATE NOCASE
             AND EXISTS (
               SELECT 1
                 FROM puuid_matches pm
                 JOIN match_participants p
                   ON p.match_id = pm.match_id AND p.puuid = pm.puuid
                WHERE pm.puuid = ps.puuid
             )
           ORDER BY COALESCE(ps.last_synced_at, 0) DESC
           LIMIT 1`,
    args: [gameName, tagLine],
  });
  const row = result.rows[0];
  if (!row) return null;
  const platform = str(row.platform_id);
  if (!isPlatform(platform)) return null;
  return {
    puuid: str(row.puuid),
    platform,
    gameName: row.game_name == null ? null : str(row.game_name),
    tagLine: row.tag_line == null ? null : str(row.tag_line),
  };
}

export type PendingPlayer = {
  puuid: string;
  platform: Platform;
  gameName: string | null;
  tagLine: string | null;
};

/**
 * Jugadores a los que les falta historial, ordenados por "hace más que no se
 * tocan" (round-robin justo entre búsquedas nuevas y viejas).
 */
export async function listPendingPlayers(
  limit = 5,
): Promise<PendingPlayer[]> {
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT ps.puuid, ps.platform_id, ps.game_name, ps.tag_line
            FROM puuid_sync ps
           WHERE (
                   ps.backfill_state <> 'done'
                   OR EXISTS (
                     SELECT 1
                       FROM puuid_matches pm
                       LEFT JOIN matches m ON m.match_id = pm.match_id
                      WHERE pm.puuid = ps.puuid AND m.match_id IS NULL
                   )
                 )
             AND (ps.locked_until IS NULL OR ps.locked_until < ?)
           ORDER BY COALESCE(ps.last_synced_at, 0) ASC
           LIMIT ?`,
    args: [Date.now(), limit],
  });

  return result.rows
    .map((row) => ({
      puuid: str(row.puuid),
      platform: str(row.platform_id),
      gameName: row.game_name == null ? null : str(row.game_name),
      tagLine: row.tag_line == null ? null : str(row.tag_line),
    }))
    .filter((row): row is PendingPlayer => isPlatform(row.platform));
}

export async function countPendingPlayers(): Promise<number> {
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT COUNT(*) AS n
            FROM puuid_sync ps
           WHERE (
             ps.backfill_state <> 'done'
             OR EXISTS (
               SELECT 1
                 FROM puuid_matches pm
                 LEFT JOIN matches m ON m.match_id = pm.match_id
                WHERE pm.puuid = ps.puuid AND m.match_id IS NULL
             )
           )`,
  });
  return num(result.rows[0]?.n);
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
    "accounts",
  ]) {
    await c.execute(`DELETE FROM ${table}`);
  }
}

export type MatchDetailParticipant = {
  puuid: string;
  riotId: string | null;
  championId: number;
  championName: string;
  teamId: number;
  position: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  cs: number;
  vision: number;
  damage: number;
};

export type MatchDetail = {
  matchId: string;
  platformId: string;
  queueId: number;
  gameVersion: string;
  startedAt: number;
  durationSeconds: number;
  participants: MatchDetailParticipant[];
};

/** Partida completa (los 10 jugadores) para la página de detalle. */
export async function getMatchDetail(
  matchId: string,
): Promise<MatchDetail | null> {
  await ensureSchema();
  const c = db();

  const match = await c.execute({
    sql: "SELECT * FROM matches WHERE match_id = ?",
    args: [matchId],
  });
  const row = match.rows[0];
  if (!row) return null;

  const parts = await c.execute({
    sql: "SELECT * FROM match_participants WHERE match_id = ?",
    args: [matchId],
  });

  return {
    matchId,
    platformId: str(row.platform_id),
    queueId: num(row.queue_id),
    gameVersion: str(row.game_version),
    startedAt: num(row.game_start_ts),
    durationSeconds: num(row.game_duration_s),
    participants: parts.rows.map((p) => ({
      puuid: str(p.puuid),
      riotId: p.riot_id == null ? null : str(p.riot_id),
      championId: num(p.champion_id),
      championName: str(p.champion_name),
      teamId: num(p.team_id),
      position: str(p.team_position) || null,
      win: num(p.win) === 1,
      kills: num(p.kills),
      deaths: num(p.deaths),
      assists: num(p.assists),
      gold: num(p.gold_earned),
      cs: num(p.cs),
      vision: num(p.vision_score),
      damage: num(p.damage),
    })),
  };
}

export type PlayerLabel = { gameName: string; tagLine: string; platform: string };

/**
 * Nombre y región de un jugador, para el link de vuelta al perfil.
 *
 * El puuid que viene en la URL de una partida es el del participante, que puede
 * ser un alias (Riot reasigna puuids) sin Riot ID propio en `puuid_sync`. Por eso
 * se resuelve en tres pasos, del más fiel al más aproximado.
 */
export async function getPlayerLabel(
  puuid: string,
): Promise<PlayerLabel | null> {
  await ensureSchema();

  // 1) Caso normal: el puuid es el perfil que ya sincronizamos.
  const result = await db().execute({
    sql: "SELECT game_name, tag_line, platform_id FROM puuid_sync WHERE puuid = ?",
    args: [puuid],
  });
  const row = result.rows[0];
  if (row?.game_name) {
    return {
      gameName: str(row.game_name),
      tagLine: str(row.tag_line),
      platform: str(row.platform_id),
    };
  }

  // 2) Alias: buscamos el perfil guardado con el mismo Riot ID que Riot reportó
  //    en alguna partida de este puuid (así se descubren los alias).
  const aliased = await db().execute({
    sql: `SELECT ps.game_name, ps.tag_line, ps.platform_id
            FROM match_participants mp
            JOIN matches m ON m.match_id = mp.match_id
            JOIN puuid_sync ps
              ON ps.game_name = substr(mp.riot_id, 1, instr(mp.riot_id, '#') - 1)
             COLLATE NOCASE
             AND ps.tag_line = substr(mp.riot_id, instr(mp.riot_id, '#') + 1)
             COLLATE NOCASE
           WHERE mp.puuid = ?
             AND instr(mp.riot_id, '#') > 1
             AND ps.game_name IS NOT NULL
           ORDER BY m.game_start_ts DESC
           LIMIT 1`,
    args: [puuid],
  });
  const aliasRow = aliased.rows[0];
  if (aliasRow?.game_name) {
    return {
      gameName: str(aliasRow.game_name),
      tagLine: str(aliasRow.tag_line),
      platform: str(aliasRow.platform_id),
    };
  }

  // 3) Último recurso: el Riot ID que Riot guardó en sus partidas y la región
  //    de esa partida. El perfil se puede abrir igual (lo resuelve la API).
  const own = await db().execute({
    sql: `SELECT mp.riot_id, m.platform_id
            FROM match_participants mp
            JOIN matches m ON m.match_id = mp.match_id
           WHERE mp.puuid = ? AND instr(mp.riot_id, '#') > 1
           ORDER BY m.game_start_ts DESC
           LIMIT 1`,
    args: [puuid],
  });
  const ownRow = own.rows[0];
  if (!ownRow) return null;
  const riotId = str(ownRow.riot_id);
  const cut = riotId.lastIndexOf("#");
  if (cut <= 0) return null;
  return {
    gameName: riotId.slice(0, cut),
    tagLine: riotId.slice(cut + 1),
    platform: str(ownRow.platform_id),
  };
}

export { participantOf };
