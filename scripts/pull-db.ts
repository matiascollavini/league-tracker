#!/usr/bin/env tsx
/**
 * Trae la base de producción (Turso) al SQLite local.
 *
 * Es la dirección inversa de `db:copy` y sirve para que `npm run dev` vea
 * exactamente los mismos datos que la web deployada: sin esto, dev lee
 * `data/league.db` (parcial, sólo lo que se ingirió localmente) y producción
 * lee Turso (el historial completo que mantiene el worker). Esa diferencia de
 * base es la que hace que un perfil muestre otro pool de campeones, otro
 * "Por campeón" y otros picks.
 *
 *   npm run db:pull
 *
 * - Lee las credenciales de Turso de `.env.turso.local` (las mismas que usa
 *   `npm run ingest -- ... --prod`). No hace falta exportar nada a mano.
 * - Escribe con `INSERT OR REPLACE` sobre `data/league.db`: es idempotente y
 *   nunca borra filas locales, así que se puede correr las veces que quieras.
 * - No toca producción: a Turso sólo le hace SELECT.
 */

import { createClient } from "@libsql/client";
import { loadEnv } from "./env";

const LOCAL_URL = "file:./data/league.db";
const CHUNK = 100;

const TABLES = [
  {
    name: "matches",
    columns:
      "match_id, platform_id, queue_id, game_mode, game_version, game_start_ts, game_duration_s, fetched_at",
  },
  {
    name: "match_participants",
    columns:
      "match_id, puuid, champion_id, champion_name, riot_id, team_id, team_position, win, kills, deaths, assists, gold_earned, cs, vision_score, damage, profile_icon, summoner_level",
  },
  { name: "puuid_matches", columns: "puuid, match_id" },
  {
    name: "puuid_sync",
    columns:
      "puuid, platform_id, game_name, tag_line, last_synced_at, newest_ts, oldest_ts, ids_cursor, backfill_state, locked_until, locked_by",
  },
  {
    name: "accounts",
    columns:
      "puuid, platform_id, game_name, tag_line, name_lower, profile_icon, summoner_level, last_seen_ts, updated_at",
  },
  {
    name: "league_snapshots",
    columns: "puuid, platform_id, payload, updated_at",
  },
];

async function main() {
  // `.env.turso.local` pisa los valores de `.env.local` (mismo criterio que
  // `npm run ingest -- ... --prod`).
  process.env.TURSO = "1";
  loadEnv();

  const sourceUrl = process.env.DATABASE_URL;
  const sourceToken = process.env.DATABASE_AUTH_TOKEN;

  if (!sourceUrl?.startsWith("libsql://")) {
    console.error(
      "\nDATABASE_URL no apunta a Turso. Revisá .env.turso.local\n" +
        "(tiene que empezar con libsql://).\n",
    );
    process.exit(1);
  }

  const source = createClient({ url: sourceUrl, authToken: sourceToken });
  console.log(`\ndb:pull — ${new URL(sourceUrl).host} → ${LOCAL_URL}\n`);

  // El cliente local se resuelve recién acá, cuando DATABASE_URL ya apunta al
  // archivo: el cliente de `src/lib/db` cachea la config en la primera llamada.
  process.env.DATABASE_URL = LOCAL_URL;
  delete process.env.DATABASE_AUTH_TOKEN;

  const { db, ensureSchema } = await import("../src/lib/db/client");
  await ensureSchema();
  const target = db();

  let totalRows = 0;

  for (const table of TABLES) {
    const rows = await source.execute(`SELECT ${table.columns} FROM ${table.name}`);

    if (rows.rows.length === 0) {
      console.log(`  · ${table.name.padEnd(20)} vacía`);
      continue;
    }

    const placeholders = `(${table.columns.split(",").map(() => "?").join(", ")})`;
    let copied = 0;

    for (let index = 0; index < rows.rows.length; index += CHUNK) {
      const slice = rows.rows.slice(index, index + CHUNK);
      const args = slice.flatMap((row) =>
        table.columns.split(",").map((column) => row[column.trim()] ?? null),
      );

      await target.execute({
        sql: `INSERT OR REPLACE INTO ${table.name} (${table.columns}) VALUES ${slice
          .map(() => placeholders)
          .join(", ")}`,
        args,
      });

      copied += slice.length;
    }

    totalRows += copied;
    console.log(`  ✓ ${table.name.padEnd(20)} ${copied} filas`);
  }

  console.log(`\nListo: ${totalRows} filas copiadas a ${LOCAL_URL}\n`);
  console.log("Ahora `npm run dev` ve los mismos datos que producción.\n");
  process.exit(0);
}

void main().catch((error: unknown) => {
  console.error("\ndb:pull falló:", error instanceof Error ? error.message : error, "\n");
  process.exit(1);
});
