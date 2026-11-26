import { db, ensureSchema } from "./client";
import type { Platform } from "@/lib/riot/config";
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
