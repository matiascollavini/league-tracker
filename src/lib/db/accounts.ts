import { db, ensureSchema, getMeta, setMeta } from "./client";

/**
 * Índice de cuentas para el buscador del header.
 *
 * Riot **no** tiene un endpoint de búsqueda por nombre (ver ADR-014 y
 * `docs/API-LOL.txt`): `account-v1` solo resuelve un Riot ID exacto. Entonces el
 * autocompletado no puede preguntarle a Riot en cada tecla; se construye un
 * índice propio con los jugadores que ya vimos como participantes de las
 * partidas guardadas (10 por partida) y con las cuentas que alguien buscó.
 *
 * Una fila por puuid: el nombre más nuevo gana. La tabla es chica (una fila por
 * jugador conocido) y se escribe en el mismo batch que la partida.
 */

export type AccountHit = {
  puuid: string;
  gameName: string;
  tagLine: string;
  platformId: string;
  profileIcon: number | null;
  level: number | null;
  lastSeenTs: number;
};

const str = (value: unknown): string => (value == null ? "" : String(value));

const numOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Partes de un Riot ID. Solo corta por el último `#`; valida largos el caller. */
export function splitRiotId(raw: string): { name: string; tag: string | null } {
  const value = raw.trim();
  const hash = value.lastIndexOf("#");
  if (hash < 0) return { name: value, tag: null };
  return {
    name: value.slice(0, hash).trim(),
    tag: value.slice(hash + 1).trim() || null,
  };
}

export type AccountUpsert = {
  puuid: string;
  platformId: string;
  gameName: string;
  tagLine: string;
  profileIcon?: number | null;
  level?: number | null;
  /** Timestamp de la partida desde la que se conoce. `0` si no aplica. */
  lastSeenTs?: number;
};

/**
 * Statement de upsert, para poder meterlo en el batch que guarda la partida.
 *
 * El nombre solo se pisa si la fila entrante es igual o más nueva: el ingest
 * baja partidas del más nuevo al más viejo, así que sin este guard una partida
 * de hace un año podría restaurar un Riot ID que el jugador ya cambió. Las
 * búsquedas directas (`loadProfile`) pasan `lastSeenTs = Date.now()` y ganan
 * siempre, porque ahí el nombre viene de `account-v1`, la fuente autoritativa.
 */
export function accountUpsertStatement(input: AccountUpsert) {
  const lastSeenTs = input.lastSeenTs ?? 0;
  return {
    sql: `INSERT INTO accounts
            (puuid, platform_id, game_name, tag_line, name_lower,
             profile_icon, summoner_level, last_seen_ts, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET
            game_name = CASE WHEN excluded.last_seen_ts >= accounts.last_seen_ts
                             THEN excluded.game_name ELSE accounts.game_name END,
            tag_line = CASE WHEN excluded.last_seen_ts >= accounts.last_seen_ts
                            THEN excluded.tag_line ELSE accounts.tag_line END,
            name_lower = CASE WHEN excluded.last_seen_ts >= accounts.last_seen_ts
                              THEN excluded.name_lower ELSE accounts.name_lower END,
            platform_id = accounts.platform_id,
            profile_icon = COALESCE(excluded.profile_icon, accounts.profile_icon),
            summoner_level = COALESCE(excluded.summoner_level, accounts.summoner_level),
            last_seen_ts = MAX(accounts.last_seen_ts, excluded.last_seen_ts),
            updated_at = excluded.updated_at`,
    args: [
      input.puuid,
      input.platformId,
      input.gameName,
      input.tagLine,
      input.gameName.toLowerCase(),
      input.profileIcon ?? null,
      input.level ?? null,
      lastSeenTs,
      Date.now(),
    ],
  };
}

/** Upsert de un solo registro (búsquedas directas, cuenta recién resuelta). */
export async function saveAccount(input: AccountUpsert): Promise<void> {
  if (!input.gameName || !input.tagLine) return;
  await ensureSchema();
  await db().execute(accountUpsertStatement(input));
}

export type SearchOptions = {
  limit?: number;
  /** Acota a una plataforma. Sin valor, busca en todas (el header no pregunta región). */
  platform?: string;
};

/** Máximo de sugerencias que devuelve el buscador. */
export const SEARCH_LIMIT = 8;
const MAX_LIMIT = 12;

/**
 * Sugerencias por prefijo de nombre (y, si el usuario escribió `#`, también por
 * tag). Sin `LIKE`: comparamos `substr()` para que `%` y `_` escritos por el
 * usuario sean literales y no comodines.
 */
export async function searchAccounts(
  rawQuery: string,
  options: SearchOptions = {},
): Promise<AccountHit[]> {
  const { name, tag } = splitRiotId(rawQuery);
  if (name.length < 2) return [];

  await ensureSchema();

  const nameLower = name.toLowerCase();
  const limit = Math.min(Math.max(options.limit ?? SEARCH_LIMIT, 1), MAX_LIMIT);

  // Prefijo indexable (ADR-027): un rango sobre `idx_accounts_name` recorre solo
  // las entradas que empiezan con el nombre, en vez de escanear las 42 k cuentas
  // que hacía `substr(name_lower, 1, n) = ?` a secas. El `substr` se queda como
  // chequeo exacto del prefijo (se evalúa sobre las filas ya filtradas, no
  // cuesta lecturas) y no interpreta `%` ni `_` como comodines.
  const prefixEnd = `${nameLower}${String.fromCodePoint(0x10ffff)}`;
  const where = [
    "name_lower >= ? AND name_lower < ?",
    "substr(name_lower, 1, ?) = ?",
  ];
  const args: (string | number)[] = [
    nameLower,
    prefixEnd,
    nameLower.length,
    nameLower,
  ];

  if (tag) {
    where.push("substr(lower(tag_line), 1, ?) = ?");
    args.push(tag.toLowerCase().length, tag.toLowerCase());
  }
  if (options.platform) {
    where.push("platform_id = ?");
    args.push(options.platform);
  }

  const result = await db().execute({
    sql: `SELECT puuid, platform_id, game_name, tag_line, profile_icon,
                 summoner_level, last_seen_ts
            FROM accounts
           WHERE ${where.join(" AND ")}
           ORDER BY (name_lower = ?) DESC, length(game_name) ASC,
                    last_seen_ts DESC, game_name ASC
           LIMIT ?`,
    args: [...args, nameLower, limit],
  });

  return result.rows.map((row) => ({
    puuid: str(row.puuid),
    gameName: str(row.game_name),
    tagLine: str(row.tag_line),
    platformId: str(row.platform_id),
    profileIcon: numOrNull(row.profile_icon),
    level: numOrNull(row.summoner_level),
    lastSeenTs: numOrNull(row.last_seen_ts) ?? 0,
  }));
}

export type FeaturedAccount = AccountHit & {
  /** Partidas guardadas en las que participó (criterio del ranking). */
  games: number;
};

/**
 * Cuánto vive la foto de recomendados. La consulta que la calcula es cara
 * (~106 k filas leídas, ADR-027) y el ranking cambia lento: se relee de la base
 * cada 6 h por defecto (`FEATURED_TTL_MS`), y el resto del tiempo son ≤24 filas.
 */
function featuredTtl(): number {
  const raw = Number(process.env.FEATURED_TTL_MS ?? 6 * 60 * 60 * 1000);
  if (!Number.isFinite(raw)) return 6 * 60 * 60 * 1000;
  return Math.min(Math.max(Math.floor(raw), 0), 24 * 60 * 60 * 1000);
}

const FEATURED_KEY = "featured_cache_at";
const FEATURED_MAX = 24;

/**
 * Cuentas "recomendadas" para la landing: las que más partidas guardadas
 * tienen, desempatando por la más reciente.
 *
 * El `JOIN` con `match_participants` es a propósito: solo se recomiendan
 * cuentas con partidas propias. Una fila de `accounts` sin partidas (creada al
 * visitar un perfil, por ejemplo) no tiene nada interesante que mostrar.
 *
 * Esa consulta escanea `accounts` entero y recorre los 63 k links de
 * `puuid_matches`, así que NO se ejecuta por visita: se guarda en
 * `featured_cache` y se refresca cada `FEATURED_TTL_MS` (ADR-027).
 */
export async function featuredAccounts(limit = 8): Promise<FeaturedAccount[]> {
  const max = Math.min(Math.max(Math.trunc(limit), 1), FEATURED_MAX);
  await ensureSchema();

  const cached = await readFeaturedCache();
  if (cached && Date.now() - cached.at < featuredTtl()) {
    return cached.rows.slice(0, max);
  }

  const fresh = await computeFeatured(FEATURED_MAX);
  await writeFeaturedCache(fresh);
  return fresh.slice(0, max);
}

async function readFeaturedCache(): Promise<{
  rows: FeaturedAccount[];
  at: number;
} | null> {
  const [at, result] = await Promise.all([
    getMeta(FEATURED_KEY),
    db().execute({
      sql: `SELECT puuid, platform_id, game_name, tag_line, profile_icon,
                   summoner_level, last_seen_ts, games
              FROM featured_cache
             ORDER BY rank ASC`,
      args: [],
    }),
  ]);
  if (at == null || result.rows.length === 0) return null;
  const stamp = Number(at);
  if (!Number.isFinite(stamp)) return null;

  return {
    at: stamp,
    rows: result.rows.map((row) => ({
      puuid: str(row.puuid),
      gameName: str(row.game_name),
      tagLine: str(row.tag_line),
      platformId: str(row.platform_id),
      profileIcon: numOrNull(row.profile_icon),
      level: numOrNull(row.summoner_level),
      lastSeenTs: numOrNull(row.last_seen_ts) ?? 0,
      games: Number(row.games ?? 0),
    })),
  };
}

/** Consulta cara: una vez cada TTL, nunca por visita. */
async function computeFeatured(max: number): Promise<FeaturedAccount[]> {
  const result = await db().execute({
    sql: `SELECT a.puuid, a.platform_id, a.game_name, a.tag_line,
                 a.profile_icon, a.summoner_level, a.last_seen_ts,
                 COUNT(DISTINCT mp.match_id) AS games
            FROM accounts a
            JOIN match_participants mp ON mp.puuid = a.puuid
           GROUP BY a.puuid
           ORDER BY games DESC, a.last_seen_ts DESC, a.game_name ASC
           LIMIT ?`,
    args: [max],
  });

  return result.rows.map((row) => ({
    puuid: str(row.puuid),
    gameName: str(row.game_name),
    tagLine: str(row.tag_line),
    platformId: str(row.platform_id),
    profileIcon: numOrNull(row.profile_icon),
    level: numOrNull(row.summoner_level),
    lastSeenTs: numOrNull(row.last_seen_ts) ?? 0,
    games: Number(row.games ?? 0),
  }));
}

async function writeFeaturedCache(rows: readonly FeaturedAccount[]): Promise<void> {
  const statements = [
    { sql: "DELETE FROM featured_cache", args: [] },
    ...rows.map((row, index) => ({
      sql: `INSERT OR REPLACE INTO featured_cache
              (rank, puuid, platform_id, game_name, tag_line, profile_icon,
               summoner_level, last_seen_ts, games)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        index,
        row.puuid,
        row.platformId,
        row.gameName,
        row.tagLine,
        row.profileIcon,
        row.level,
        row.lastSeenTs,
        row.games,
      ],
    })),
  ];

  // La foto y su marca de tiempo van en el mismo batch: si se corta, la próxima
  // visita recalcula (peor caso: una consulta cara de más), nunca sirve vacío.
  statements.push({
    sql: "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
    args: [FEATURED_KEY, String(Date.now())],
  });

  await db().batch(statements, "write");
}

const ACCOUNTS_COUNT_KEY = "accounts_count";

/** Cuántas cuentas hay indexadas (para el estado del buscador y /api/health). */
export async function countAccounts(): Promise<number> {
  await ensureSchema();

  // `COUNT(*)` sobre `accounts` recorre el índice entero (42 k lecturas). El
  // número solo se usa como dato informativo de la UI: se cachea en `meta`
  // unos minutos (ADR-027).
  const raw = await getMeta(ACCOUNTS_COUNT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { n?: unknown; at?: unknown };
      const n = Number(parsed.n);
      const at = Number(parsed.at);
      const ttl = Number(process.env.ACCOUNTS_COUNT_TTL_MS ?? 300_000);
      if (Number.isFinite(n) && Number.isFinite(at) && Date.now() - at < ttl) {
        return n;
      }
    } catch {
      // Valor viejo o corrupto: se recalcula abajo.
    }
  }

  const result = await db().execute("SELECT COUNT(*) AS n FROM accounts");
  const total = Number(result.rows[0]?.n ?? 0);
  await setMeta(ACCOUNTS_COUNT_KEY, JSON.stringify({ n: total, at: Date.now() }));
  return total;
}
