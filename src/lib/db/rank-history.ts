import { db, ensureSchema } from "./client";
import { isPlatform, type Platform } from "@/lib/riot/config";
import type { LeagueEntry } from "@/lib/riot/types";
import type { RankHistoryEntry } from "@/lib/riot/rank-history";

/**
 * Persistencia del historial de rango (ADR-026).
 *
 * Riot solo expone el rango actual, así que la serie se arma con fotos
 * propias. Se guarda una fila **solo cuando cambia** tier, división o LP: un
 * perfil que se abre diez veces sin jugar no infla la tabla. El gráfico se
 * dibuja con esas filas, no con requests a Riot.
 */

const num = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown): string => (value == null ? "" : String(value));

/**
 * INSERT condicional: si la última foto de esa cola tiene los mismos valores,
 * no hace nada. `division IS ?` compara NULL con NULL (a diferencia de `=`).
 */
const INSERT_SNAPSHOT = `INSERT OR IGNORE INTO league_history
    (puuid, platform_id, queue_type, ts, tier, division, league_points, wins, losses)
  SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
   WHERE NOT EXISTS (
     SELECT 1
       FROM league_history
      WHERE puuid = ?
        AND queue_type = ?
        AND ts = (
          SELECT MAX(ts) FROM league_history
           WHERE puuid = ? AND queue_type = ?
        )
        AND tier = ?
        AND division IS ?
        AND league_points = ?
   )`;

/**
 * Guarda la foto del rango que acaba de devolver `league-v4`.
 *
 * `now` se puede fijar en los tests. Las entradas sin tier (jugador sin
 * clasificar) no se guardan: no hay nada que graficar.
 */
export async function recordLeagueHistory(
  puuid: string,
  platform: Platform,
  entries: readonly LeagueEntry[],
  now = Date.now(),
): Promise<void> {
  const statements = entries
    .filter((entry) => entry.tier && entry.tier.trim() !== "")
    .map((entry) => ({
      sql: INSERT_SNAPSHOT,
      args: [
        puuid,
        platform,
        entry.queueType,
        now,
        entry.tier!.trim().toUpperCase(),
        entry.rank ?? null,
        Math.max(0, Math.round(entry.leaguePoints ?? 0)),
        entry.wins ?? null,
        entry.losses ?? null,
        puuid,
        entry.queueType,
        puuid,
        entry.queueType,
        entry.tier!.trim().toUpperCase(),
        entry.rank ?? null,
        Math.max(0, Math.round(entry.leaguePoints ?? 0)),
      ],
    }));

  if (statements.length === 0) return;
  await ensureSchema();
  await db().batch(statements, "write");
}

/**
 * Historial de las colas pedidas, en orden cronológico. Acepta varios puuids
 * porque Riot reasigna la identidad del jugador y el historial puede estar
 * partido entre alias (ADR-010).
 */
export async function getLeagueHistory(
  puuid: string | readonly string[],
  queueTypes: readonly string[],
): Promise<RankHistoryEntry[]> {
  const ids = [...new Set((typeof puuid === "string" ? [puuid] : [...puuid]).filter(Boolean))];
  const queues = [...new Set(queueTypes.filter(Boolean))];
  if (ids.length === 0 || queues.length === 0) return [];

  await ensureSchema();

  const inIds = ids.map(() => "?").join(",");
  const inQueues = queues.map(() => "?").join(",");
  const result = await db().execute({
    sql: `SELECT queue_type, ts, tier, division, league_points
            FROM league_history
           WHERE puuid IN (${inIds})
             AND queue_type IN (${inQueues})
           ORDER BY ts ASC`,
    args: [...ids, ...queues],
  });

  return result.rows.map((row) => ({
    queueType: str(row.queue_type),
    ts: num(row.ts),
    tier: str(row.tier),
    division: row.division == null ? null : str(row.division),
    leaguePoints: num(row.league_points),
  }));
}

/** Una cuenta a la que el cron le puede tomar la foto del rango. */
export type RankSnapshotTarget = {
  puuid: string;
  platform: Platform;
  /** Nombre visible para el log del job (no es secreto: es el Riot ID). */
  label: string;
  /** Última vez que se consultó el rango (aunque no tuviera rank). */
  polledAt: number | null;
};

/**
 * Cuentas de la cola (las que el worker ya ingesta) ordenadas por hace cuánto
 * que no se les consulta el rango. Con un `limit` menor al total, cada corrida
 * agarra a las más viejas y el conjunto rota solo.
 */
export async function listRankSnapshotTargets(
  limit = 400,
): Promise<RankSnapshotTarget[]> {
  const capped = Math.max(1, Math.min(5_000, Math.floor(limit)));
  await ensureSchema();
  const result = await db().execute({
    sql: `SELECT ps.puuid, ps.platform_id, ps.game_name, ps.tag_line,
                 rp.ts AS polled_at
            FROM puuid_sync ps
            LEFT JOIN rank_polls rp ON rp.puuid = ps.puuid
           ORDER BY COALESCE(rp.ts, 0) ASC
           LIMIT ?`,
    args: [capped],
  });

  return result.rows
    .map((row) => ({
      puuid: str(row.puuid),
      platform: str(row.platform_id),
      gameName: row.game_name == null ? null : str(row.game_name),
      tagLine: row.tag_line == null ? null : str(row.tag_line),
      polledAt: row.polled_at == null ? null : num(row.polled_at),
    }))
    .filter((row): row is typeof row & { platform: Platform } =>
      isPlatform(row.platform),
    )
    .map((row) => ({
      puuid: row.puuid,
      platform: row.platform,
      label: `${row.gameName ?? row.puuid.slice(0, 8)}${row.tagLine ? `#${row.tagLine}` : ""}`,
      polledAt: row.polledAt,
    }));
}

/** Marca que el rango de esa cuenta ya se consultó en esta vuelta del cron. */
export async function recordRankPoll(
  puuid: string,
  ts = Date.now(),
): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `INSERT INTO rank_polls (puuid, ts) VALUES (?, ?)
          ON CONFLICT(puuid) DO UPDATE SET ts = MAX(excluded.ts, rank_polls.ts)`,
    args: [puuid, ts],
  });
}
