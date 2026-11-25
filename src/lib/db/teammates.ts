import { db, ensureSchema } from "./client";
import { splitRiotId } from "./accounts";
import {
  mergeTeammates,
  type TeammateAggregate,
  type TeammateStat,
} from "@/lib/riot/teammates";

/**
 * Compañeros de equipo más frecuentes, agregados en SQL.
 *
 * El perfil lee de la base solo la fila del jugador en cada partida, así que
 * los otros 9 participantes no están en memoria: hay que ir a
 * `match_participants`. La consulta se apoya en la PK (match_id, puuid) y en
 * `puuid_matches`, y devuelve como mucho `limit` filas.
 */
type PuuidArg = string | readonly string[];

function puuidList(value: PuuidArg): string[] {
  return typeof value === "string" ? [value] : [...value];
}

const inClause = (count: number): string =>
  Array.from({ length: count }, () => "?").join(",");

const num = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const str = (value: unknown): string => (value == null ? "" : String(value));
const strOrNull = (value: unknown): string | null =>
  value == null || value === "" ? null : String(value);

export type TeammateOptions = {
  /** Colas a incluir. Vacío = todas (el filtro de tabs del perfil). */
  queueIds?: readonly number[];
  limit?: number;
};

export async function getTopTeammates(
  puuid: PuuidArg,
  options: TeammateOptions = {},
): Promise<TeammateStat[]> {
  const ids = [...new Set(puuidList(puuid).filter(Boolean))];
  if (ids.length === 0) return [];

  const limit = Math.max(1, Math.min(20, Math.floor(options.limit ?? 5)));
  const queueIds = (options.queueIds ?? []).filter((id) => Number.isFinite(id));
  await ensureSchema();

  const inSql = inClause(ids.length);
  const queueSql =
    queueIds.length > 0
      ? `AND m.queue_id IN (${inClause(queueIds.length)})`
      : "";

  const result = await db().execute({
    sql: `WITH me AS (
            /* Las partidas del jugador. DISTINCT porque un mismo partido puede
               estar linkeado a dos puuids suyos (Riot los reasigna). */
            SELECT DISTINCT pm.match_id, p.team_id, p.win,
                            m.game_start_ts, m.platform_id
              FROM puuid_matches pm
              JOIN matches m ON m.match_id = pm.match_id
              JOIN match_participants p
                ON p.match_id = pm.match_id AND p.puuid IN (${inSql})
             WHERE pm.puuid IN (${inSql})
               ${queueSql}
          ),
          duo AS (
            SELECT t.puuid,
                   COUNT(DISTINCT me.match_id) AS games,
                   SUM(me.win) AS wins,
                   MAX(me.game_start_ts) AS last_ts,
                   /* Columnas "desnudas" junto al único MAX: SQLite las toma
                      de la fila de la partida más nueva (documentado). */
                   t.riot_id, t.profile_icon, me.platform_id
              FROM me
              JOIN match_participants t
                ON t.match_id = me.match_id
               AND t.team_id = me.team_id
               AND t.puuid NOT IN (${inSql})
             GROUP BY t.puuid
          )
          SELECT d.puuid, d.games, d.wins, d.last_ts, d.riot_id,
                 d.profile_icon AS match_icon,
                 d.platform_id AS match_platform,
                 a.game_name, a.tag_line,
                 a.profile_icon AS account_icon,
                 /* accounts puede tener el icono en NULL (filas viejas):
                    se rescata el de la partida más nueva que sí lo trajo. */
                 (SELECT t2.profile_icon
                    FROM match_participants t2
                    JOIN matches m2 ON m2.match_id = t2.match_id
                   WHERE t2.puuid = d.puuid AND t2.profile_icon IS NOT NULL
                   ORDER BY m2.game_start_ts DESC
                   LIMIT 1) AS fallback_icon,
                 a.platform_id AS account_platform
            FROM duo d
            LEFT JOIN accounts a ON a.puuid = d.puuid
           ORDER BY d.games DESC, d.wins DESC, d.last_ts DESC
           LIMIT ?`,
    // Args en orden: 3 IN (p.puuid, pm.puuid, t.puuid) + colas + LIMIT.
    args: [...ids, ...ids, ...queueIds, ...ids, limit],
  });

  const rows: TeammateAggregate[] = [];
  for (const row of result.rows) {
    const stored = row.riot_id == null ? null : splitRiotId(str(row.riot_id));
    const accountName = strOrNull(row.game_name);
    const accountTag = strOrNull(row.tag_line);
    const matchIcon = row.match_icon == null ? null : num(row.match_icon);
    const accountIcon = row.account_icon == null ? null : num(row.account_icon);
    const fallbackIcon =
      row.fallback_icon == null ? null : num(row.fallback_icon);

    rows.push({
      puuid: str(row.puuid),
      gameName: accountName ?? stored?.name ?? null,
      tagLine: accountTag ?? stored?.tag ?? null,
      platform: strOrNull(row.account_platform) ?? strOrNull(row.match_platform),
      profileIcon: accountIcon ?? matchIcon ?? fallbackIcon,
      games: num(row.games),
      wins: num(row.wins),
      lastPlayedAt: num(row.last_ts),
    });
  }

  return mergeTeammates(rows, limit);
}
