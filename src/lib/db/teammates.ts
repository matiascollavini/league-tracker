import { db, ensureSchema } from "./client";
import { splitRiotId } from "./accounts";
import {
  mergeTeammates,
  type TeammateAggregate,
  type TeammateStat,
} from "@/lib/riot/teammates";

/**
 * Compañeros de equipo más frecuentes.
 *
 * Contarlos en SQL por visita era lo más caro del perfil (ADR-027): el perfil
 * solo trae la fila del jugador, así que había que recorrer las 883 partidas
 * guardadas × 11 participantes de `match_participants` (~12 k filas leídas por
 * render). Ahora el agregado se guarda en `teammates_cache` como **una fila
 * JSON** por jugador, con una entrada por (cola, compañero), y el render la
 * filtra en memoria: 1 lectura en vez de 12 k.
 *
 * La caché se invalida sola comparando `covered` (partidas detalladas que se
 * plegaron) contra las partidas conocidas del jugador, que el panel ya trae
 * gratis (`progress.known`). Cuando no coinciden se recalcula, con un
 * intervalo mínimo (`TEAMMATES_REFRESH_MS`, 10 min) para que un backfill en
 * curso no dispare un recálculo por visita.
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
const numOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export type TeammateOptions = {
  /** Colas a incluir. Vacío = todas (el filtro de tabs del perfil). */
  queueIds?: readonly number[];
  limit?: number;
  /**
   * Partidas conocidas del jugador (`progress.known`). Si no se pasa, se
   * cuenta contra la base (un índice extra de ~900 entradas).
   */
  known?: number;
};

/** Una entrada de la caché: (cola, compañero). Claves cortas para el JSON. */
export type CachedTeammateRow = {
  /** queue_id */
  q: number;
  /** puuid del compañero */
  p: string;
  /** riot_id tal como lo mandó Riot en la partida más nueva */
  r: string | null;
  /** plataforma de las partidas */
  i: string | null;
  /** icono de perfil de la partida más nueva que lo trajo */
  c: number | null;
  /** icono de cualquiera de las partidas (fallback) */
  a: number | null;
  /** partidas juntos en esa cola */
  g: number;
  /** victorias juntos */
  w: number;
  /** game_start_ts de la partida más nueva */
  t: number;
};

type Cached = { covered: number; at: number; rows: CachedTeammateRow[] };

/**
 * Recorta la caché antes de guardarla.
 *
 * La mayoría de las entradas son gente con la que jugaste **una** partida (4 por
 * partida × 900 partidas), y esas filas no entran nunca en un top 5: guardarlas
 * infla el JSON a ~450 KB. Se conservan:
 *   - los compañeros con 2+ partidas en total (los candidatos reales), y
 *   - el top de cada cola, aunque sea de una sola partida (para que una pestaña
 *     con pocas partidas —ARAM, por ejemplo— siga mostrando a alguien).
 *
 * La poda es segura: lo que se tira no puede ganar un top 5 en ninguna cola.
 */
export function trimCachedRows(
  rows: readonly CachedTeammateRow[],
  options: { maxPerQueue?: number; minRows?: number } = {},
): CachedTeammateRow[] {
  const maxPerQueue = Math.max(1, Math.floor(options.maxPerQueue ?? 12));
  const minRows = Math.max(0, Math.floor(options.minRows ?? 400));
  if (rows.length <= minRows) return [...rows];

  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.p, (totals.get(row.p) ?? 0) + row.g);

  const keep = new Set<CachedTeammateRow>();
  for (const row of rows) {
    if ((totals.get(row.p) ?? 0) >= 2) keep.add(row);
  }

  const byQueue = new Map<number, CachedTeammateRow[]>();
  for (const row of rows) {
    const list = byQueue.get(row.q);
    if (list) list.push(row);
    else byQueue.set(row.q, [row]);
  }
  for (const list of byQueue.values()) {
    list
      .sort((a, b) => b.g - a.g || b.w - a.w || b.t - a.t)
      .slice(0, maxPerQueue)
      .forEach((row) => keep.add(row));
  }

  return rows.filter((row) => keep.has(row));
}

function refreshMs(): number {
  const raw = Number(process.env.TEAMMATES_REFRESH_MS ?? 600_000);
  if (!Number.isFinite(raw)) return 600_000;
  return Math.min(Math.max(Math.floor(raw), 0), 24 * 60 * 60 * 1000);
}

/** Identidad de la caché: el conjunto de puuids del jugador, sin importar el orden. */
function cacheKey(ids: readonly string[]): string {
  return [...ids].sort().join(",");
}

async function readCache(key: string): Promise<Cached | null> {
  const result = await db().execute({
    sql: "SELECT covered, computed_at, payload FROM teammates_cache WHERE player_puuid = ?",
    args: [key],
  });
  const row = result.rows[0];
  if (!row) return null;

  try {
    const rows = JSON.parse(str(row.payload)) as CachedTeammateRow[];
    if (!Array.isArray(rows)) return null;
    return { covered: num(row.covered), at: num(row.computed_at), rows };
  } catch {
    // Payload roto: se recalcula.
    return null;
  }
}

/** Partidas con detalle (las únicas que la caché puede plegar). */
async function countDetailed(ids: readonly string[]): Promise<number> {
  const inSql = inClause(ids.length);
  const result = await db().execute({
    sql: `SELECT COUNT(DISTINCT pm.match_id) AS n
            FROM puuid_matches pm
            JOIN matches m ON m.match_id = pm.match_id
           WHERE pm.puuid IN (${inSql})`,
    args: [...ids],
  });
  return num(result.rows[0]?.n);
}

/**
 * Recalcula la caché de un jugador: agrega por (cola, compañero) de una sola
 * pasada. Es la consulta caras de antes, pero corre una vez por tanda de
 * partidas nuevas, no por visita.
 */
async function rebuildCache(ids: readonly string[], key: string): Promise<Cached> {
  const inSql = inClause(ids.length);
  const result = await db().execute({
    sql: `WITH me AS (
            /* Las partidas del jugador. DISTINCT porque un mismo partido puede
               estar linkeado a dos puuids suyos (Riot los reasigna). */
            SELECT DISTINCT pm.match_id, p.team_id, p.win,
                            m.game_start_ts, m.platform_id, m.queue_id
              FROM puuid_matches pm
              JOIN matches m ON m.match_id = pm.match_id
              JOIN match_participants p
                ON p.match_id = pm.match_id AND p.puuid IN (${inSql})
             WHERE pm.puuid IN (${inSql})
          ),
          pairs AS (
            /* Una fila por (partida, persona). La identidad es el Riot ID y no
               el puuid: Riot reasigna puuids y una misma persona puede aparecer
               dos veces en la misma partida (4.862 de las partidas guardadas
               tienen dos puuids del mismo Riot ID). Agrupando por Riot ID, el
               "partidas juntos" no se infla. */
            SELECT me.match_id, me.queue_id, me.win, me.game_start_ts,
                   me.platform_id,
                   COALESCE(lower(t.riot_id), 'puuid:' || t.puuid) AS who,
                   t.puuid, t.riot_id, t.profile_icon
              FROM me
              JOIN match_participants t
                ON t.match_id = me.match_id
               AND t.team_id = me.team_id
               AND t.puuid NOT IN (${inSql})
             GROUP BY me.match_id, who
          ),
          stats AS (
            SELECT who, queue_id, COUNT(*) AS games, SUM(win) AS wins
              FROM pairs
             GROUP BY who, queue_id
          ),
          newest AS (
            /* Columnas "desnudas" junto al único MAX: SQLite las toma de la
               fila de la partida más nueva (documentado). Así el nombre y el
               icono que se muestran son los del Riot ID vigente. */
            SELECT who, puuid, riot_id, profile_icon,
                   MAX(game_start_ts) AS last_ts, platform_id
              FROM pairs
             GROUP BY who
          )
          SELECT s.who, s.queue_id, s.games, s.wins, n.last_ts,
                 n.puuid, n.riot_id, n.profile_icon, n.platform_id
            FROM stats s
            JOIN newest n ON n.who = s.who`,
    // Args en orden: 3 IN (p.puuid, pm.puuid, t.puuid).
    args: [...ids, ...ids, ...ids],
  });

  const rows: CachedTeammateRow[] = result.rows.map((row) => ({
    q: num(row.queue_id),
    p: str(row.puuid),
    r: strOrNull(row.riot_id),
    i: strOrNull(row.platform_id),
    c: numOrNull(row.profile_icon),
    a: numOrNull(row.profile_icon),
    g: num(row.games),
    w: num(row.wins),
    t: num(row.last_ts),
  }));

  const cached: Cached = { covered: 0, at: Date.now(), rows: trimCachedRows(rows) };

  // `covered` = partidas detalladas que realmente se plegaron. Se recalcula con
  // la misma conexión: el panel ya trae `known`, pero acá hace falta el número
  // de partidas con detalle, que es el techo de lo que esta caché puede sumar.
  cached.covered = await countDetailed(ids);

  await db().execute({
    sql: `INSERT OR REPLACE INTO teammates_cache
            (player_puuid, covered, computed_at, payload)
          VALUES (?, ?, ?, ?)`,
    args: [key, cached.covered, cached.at, JSON.stringify(cached.rows)],
  });

  return cached;
}

/** Nombre, tag e icono "oficiales" de los compañeros, si están en el índice. */
async function accountLookup(
  puuids: readonly string[],
): Promise<Map<string, { gameName: string; tagLine: string; icon: number | null; platform: string | null }>> {
  const map = new Map<
    string,
    { gameName: string; tagLine: string; icon: number | null; platform: string | null }
  >();
  if (puuids.length === 0) return map;

  const inSql = inClause(puuids.length);
  const result = await db().execute({
    sql: `SELECT puuid, game_name, tag_line, profile_icon, platform_id
            FROM accounts
           WHERE puuid IN (${inSql})`,
    args: [...puuids],
  });

  for (const row of result.rows) {
    map.set(str(row.puuid), {
      gameName: str(row.game_name),
      tagLine: str(row.tag_line),
      icon: numOrNull(row.profile_icon),
      platform: strOrNull(row.platform_id),
    });
  }
  return map;
}

export async function getTopTeammates(
  puuid: PuuidArg,
  options: TeammateOptions = {},
): Promise<TeammateStat[]> {
  const ids = [...new Set(puuidList(puuid).filter(Boolean))];
  if (ids.length === 0) return [];

  const limit = Math.max(1, Math.min(20, Math.floor(options.limit ?? 5)));
  const queueIds = (options.queueIds ?? []).filter((id) => Number.isFinite(id));
  await ensureSchema();

  const key = cacheKey(ids);
  let cached = await readCache(key);

  // ¿Sigue al día? El panel ya trae `known` (partidas registradas del jugador);
  // si la caché plegó menos, hay partidas nuevas o recién detalladas. Sin
  // `known` se cuenta acá (index-only, ~900 entradas).
  let known: number | null = options.known ?? null;
  if (cached && known === null) known = await countDetailed(ids);
  if (cached && known !== null && cached.covered !== known) {
    // Un backfill en curso cambia `known` a cada rato: se refresca como mucho
    // cada `TEAMMATES_REFRESH_MS` y mientras tanto se sirve lo último guardado.
    if (Date.now() - cached.at >= refreshMs()) cached = null;
  }

  if (!cached) {
    cached = await rebuildCache(ids, key);
  }

  const inScope =
    queueIds.length === 0
      ? cached.rows
      : cached.rows.filter((row) => queueIds.includes(row.q));
  if (inScope.length === 0) return [];

  // Primero se junta cada compañero por puuid (sus filas vienen partidas por
  // cola) y la identidad sale de su partida más nueva: así un Riot ID cambiado
  // no parte a la misma persona en dos filas. Después `mergeTeammates` junta los
  // puuids reasignados, igual que antes.
  const perTeammate = new Map<string, CachedTeammateRow>();
  for (const row of inScope) {
    const current = perTeammate.get(row.p);
    if (!current) {
      perTeammate.set(row.p, { ...row });
      continue;
    }
    current.g += row.g;
    current.w += row.w;
    current.a ??= row.a;
    if (row.t >= current.t) {
      current.t = row.t;
      current.r = row.r;
      current.i = row.i;
      current.c = row.c;
    }
  }

  const accounts = await accountLookup([...perTeammate.keys()]);

  const rows: TeammateAggregate[] = [...perTeammate.values()].map((row) => {
    const stored = row.r == null ? null : splitRiotId(row.r);
    const account = accounts.get(row.p);
    const accountName = account?.gameName || null;
    const accountTag = account?.tagLine || null;

    return {
      puuid: row.p,
      gameName: accountName ?? stored?.name ?? null,
      tagLine: accountTag ?? stored?.tag ?? null,
      platform: account?.platform ?? row.i,
      profileIcon: account?.icon ?? row.c ?? row.a,
      games: row.g,
      wins: row.w,
      lastPlayedAt: row.t,
    };
  });

  return mergeTeammates(rows, limit);
}
