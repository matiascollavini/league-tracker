import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient, type Client } from "@libsql/client";

/**
 * Una sola base SQLite para todo (local y nube).
 *
 *   Local (gratis, cero setup):  DATABASE_URL=file:./data/league.db
 *   Producción (gratis, Turso):  DATABASE_URL=libsql://<db>.turso.io
 *                                DATABASE_AUTH_TOKEN=...
 *
 * Es SQLite en los dos casos: mismo SQL, mismo código. Turso es SQLite
 * replicado; su plan free alcanza de sobra para miles de jugadores.
 */

let client: Client | null = null;
let ready: Promise<void> | null = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS meta (
     key   TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS matches (
     match_id        TEXT PRIMARY KEY,
     platform_id     TEXT NOT NULL,
     queue_id        INTEGER NOT NULL,
     game_mode       TEXT,
     game_version    TEXT NOT NULL,
     game_start_ts   INTEGER NOT NULL,
     game_duration_s INTEGER NOT NULL,
     fetched_at      INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS match_participants (
     match_id     TEXT NOT NULL,
     puuid        TEXT NOT NULL,
     champion_id  INTEGER NOT NULL,
     champion_name TEXT NOT NULL,
     riot_id      TEXT,
     profile_icon INTEGER,
     summoner_level INTEGER,
     team_id      INTEGER,
     team_position TEXT,
     win          INTEGER NOT NULL,
     kills        INTEGER NOT NULL DEFAULT 0,
     deaths       INTEGER NOT NULL DEFAULT 0,
     assists      INTEGER NOT NULL DEFAULT 0,
     gold_earned  INTEGER NOT NULL DEFAULT 0,
     cs           INTEGER NOT NULL DEFAULT 0,
     vision_score INTEGER NOT NULL DEFAULT 0,
     damage       INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (match_id, puuid)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_participants_puuid
     ON match_participants (puuid)`,
  `CREATE INDEX IF NOT EXISTS idx_matches_start
     ON matches (game_start_ts DESC)`,
  `CREATE TABLE IF NOT EXISTS league_snapshots (
     puuid      TEXT PRIMARY KEY,
     platform_id TEXT NOT NULL,
     payload    TEXT NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS puuid_matches (
     puuid    TEXT NOT NULL,
     match_id TEXT NOT NULL,
     PRIMARY KEY (puuid, match_id)
   )`,
  `CREATE TABLE IF NOT EXISTS puuid_sync (
     puuid           TEXT PRIMARY KEY,
     platform_id     TEXT NOT NULL,
     game_name       TEXT,
     tag_line        TEXT,
     last_synced_at  INTEGER,
     newest_ts       INTEGER,
     oldest_ts       INTEGER,
     ids_cursor      INTEGER NOT NULL DEFAULT 0,
     backfill_state  TEXT NOT NULL DEFAULT 'none',
     locked_until    INTEGER,
     locked_by       TEXT
   )`,
  // Índice de cuentas para el buscador del header (ADR-014). Riot no tiene
  // búsqueda por nombre: se indexan los participantes de las partidas que ya
  // tenemos, una fila por puuid, con el nombre más nuevo.
  `CREATE TABLE IF NOT EXISTS accounts (
     puuid          TEXT PRIMARY KEY,
     platform_id    TEXT NOT NULL,
     game_name      TEXT NOT NULL,
     tag_line       TEXT NOT NULL,
     name_lower     TEXT NOT NULL,
     profile_icon   INTEGER,
     summoner_level INTEGER,
     last_seen_ts   INTEGER NOT NULL DEFAULT 0,
     updated_at     INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_accounts_name
     ON accounts (name_lower)`,
];

/**
 * Migraciones para bases creadas con un esquema anterior. Corren DESPUÉS de los
 * CREATE TABLE y se ignoran si la columna ya existe.
 */
const MIGRATIONS = [
  `ALTER TABLE match_participants ADD COLUMN riot_id TEXT`,
  `ALTER TABLE puuid_sync ADD COLUMN locked_by TEXT`,
  `ALTER TABLE match_participants ADD COLUMN profile_icon INTEGER`,
  `ALTER TABLE match_participants ADD COLUMN summoner_level INTEGER`,
];

/**
 * Relleno del índice de cuentas con lo que ya estaba en la base (bases creadas
 * antes de la v5). Corre una sola vez por base, dentro del upgrade de esquema.
 *
 * El nombre sale de la partida **más nueva** de ese puuid (`MAX(game_start_ts)`
 * con columnas desnudas: SQLite las toma de la fila que gana el agregado), así
 * un Riot ID cambiado no revive con partidas viejas. Después el upsert de cada
 * partida nueva mantiene las filas al día.
 */
const BACKFILL_ACCOUNTS = [
  `INSERT OR IGNORE INTO accounts
     (puuid, platform_id, game_name, tag_line, name_lower,
      profile_icon, summoner_level, last_seen_ts, updated_at)
   SELECT mp.puuid, m.platform_id,
          substr(mp.riot_id, 1, instr(mp.riot_id, '#') - 1),
          substr(mp.riot_id, instr(mp.riot_id, '#') + 1),
          lower(substr(mp.riot_id, 1, instr(mp.riot_id, '#') - 1)),
          mp.profile_icon, mp.summoner_level, MAX(m.game_start_ts),
          CAST(strftime('%s', 'now') AS INTEGER) * 1000
     FROM match_participants mp
     JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.riot_id LIKE '%#%'
    GROUP BY mp.puuid`,
  `INSERT OR IGNORE INTO accounts
     (puuid, platform_id, game_name, tag_line, name_lower,
      profile_icon, summoner_level, last_seen_ts, updated_at)
   SELECT puuid, platform_id, game_name, tag_line, lower(game_name),
          NULL, NULL, COALESCE(newest_ts, 0),
          CAST(strftime('%s', 'now') AS INTEGER) * 1000
     FROM puuid_sync
    WHERE game_name IS NOT NULL AND game_name <> ''
      AND tag_line IS NOT NULL AND tag_line <> ''`,
];

export type DbConfig = {
  url: string;
  authToken?: string;
  /** De qué variable salió la URL (para diagnóstico, sin exponer secretos). */
  urlSource: string;
  tokenSource?: string;
};

/**
 * Acepta los nombres propios y los de la integración de Turso en Vercel
 * (esa integración inyecta TURSO_DATABASE_URL / TURSO_AUTH_TOKEN).
 */
export function dbConfig(): DbConfig {
  const urlCandidates: Array<[string, string | undefined]> = [
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["TURSO_DATABASE_URL", process.env.TURSO_DATABASE_URL],
    ["TURSO_CONNECTION_URL", process.env.TURSO_CONNECTION_URL],
  ];
  const tokenCandidates: Array<[string, string | undefined]> = [
    ["DATABASE_AUTH_TOKEN", process.env.DATABASE_AUTH_TOKEN],
    ["TURSO_AUTH_TOKEN", process.env.TURSO_AUTH_TOKEN],
  ];

  const url = urlCandidates.find(([, value]) => value?.trim());
  const token = tokenCandidates.find(([, value]) => value?.trim());

  return {
    url: url?.[1]?.trim() || "file:./data/league.db",
    authToken: token?.[1]?.trim(),
    urlSource: url?.[0] ?? "(default local)",
    tokenSource: token?.[0],
  };
}

/** Host de la base, sin credenciales (seguro para mostrar). */
export function databaseHost(): string {
  const { url } = dbConfig();
  if (url.startsWith("file:")) return "archivo local";
  try {
    return new URL(url).host;
  } catch {
    return "desconocido";
  }
}

export function db(): Client {
  if (client) return client;

  const { url, authToken } = dbConfig();

  // En local el archivo puede no existir todavía.
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    mkdirSync(dirname(path), { recursive: true });
  }

  client = authToken ? createClient({ url, authToken }) : createClient({ url });
  return client;
}

const SCHEMA_VERSION = 5;

/**
 * Crea las tablas si no existen. Idempotente y barato: en Turso cada statement
 * es un viaje de red, así que miramos `user_version` (1 viaje) y solo hacemos
 * el trabajo pesado la primera vez (1 batch).
 */
export async function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    const c = db();

    // Turso no permite `PRAGMA user_version = N`, así que la versión va en una
    // tabla. Son 2 viajes por arranque en frío y el trabajo pesado corre una vez.
    await c.execute(
      "CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );
    const current = await c.execute({
      sql: "SELECT value FROM meta WHERE key = ?",
      args: ["schema_version"],
    });
    const version = Number(current.rows[0]?.value ?? 0);
    if (version >= SCHEMA_VERSION) return;

    await c.batch(
      SCHEMA.map((sql) => ({ sql, args: [] })),
      "write",
    );

    for (const statement of MIGRATIONS) {
      try {
        await c.execute(statement);
      } catch (error) {
        // La columna ya existe: es lo esperado en bases nuevas.
        const message = error instanceof Error ? error.message : "";
        if (!/duplicate column/i.test(message)) throw error;
      }
    }

    // v5: índice de cuentas del buscador. En bases nuevas las tablas están
    // vacías y el backfill es un no-op; en las existentes corre una sola vez.
    await c.batch(
      BACKFILL_ACCOUNTS.map((sql) => ({ sql, args: [] })),
      "write",
    );

    await c.execute({
      sql: "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
      args: ["schema_version", String(SCHEMA_VERSION)],
    });
  })();
  return ready;
}

/** Para los tests: cerrar y olvidar el cliente. */
export async function closeDb(): Promise<void> {
  if (client) {
    client.close();
    client = null;
    ready = null;
  }
}
