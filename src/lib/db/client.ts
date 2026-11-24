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
];

/**
 * Migraciones para bases creadas con un esquema anterior. Corren DESPUÉS de los
 * CREATE TABLE y se ignoran si la columna ya existe.
 */
const MIGRATIONS = [
  `ALTER TABLE match_participants ADD COLUMN riot_id TEXT`,
  `ALTER TABLE puuid_sync ADD COLUMN locked_by TEXT`,
];

function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || "file:./data/league.db";
}

export function db(): Client {
  if (client) return client;

  const url = databaseUrl();
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

  // En local el archivo puede no existir todavía.
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    mkdirSync(dirname(path), { recursive: true });
  }

  client = authToken ? createClient({ url, authToken }) : createClient({ url });
  return client;
}

const SCHEMA_VERSION = 2;

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
