#!/usr/bin/env tsx
/**
 * Copia la base local (data/league.db) a la base configurada en DATABASE_URL.
 * Sirve para "subir" el historial ya descargado sin volver a pedirlo a Riot.
 *
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:copy
 */

import { createClient } from "@libsql/client";

const TABLES = [
  { name: "matches", columns: "match_id, platform_id, queue_id, game_mode, game_version, game_start_ts, game_duration_s, fetched_at" },
  { name: "match_participants", columns: "match_id, puuid, champion_id, champion_name, riot_id, team_id, team_position, win, kills, deaths, assists, gold_earned, cs, vision_score, damage" },
  { name: "puuid_matches", columns: "puuid, match_id" },
  { name: "puuid_sync", columns: "puuid, platform_id, game_name, tag_line, last_synced_at, newest_ts, oldest_ts, ids_cursor, backfill_state, locked_until, locked_by" },
];

const CHUNK = 100;

async function main() {
  const targetUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!targetUrl || !targetUrl.startsWith("libsql://")) {
    console.error("DATABASE_URL tiene que ser libsql:// (la base destino)");
    process.exit(1);
  }

  const source = createClient({ url: "file:./data/league.db" });
  const target = createClient({ url: targetUrl, authToken });

  console.log(`\nCopiando→ ${targetUrl}\n`);

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
      await target.batch(
        slice.map((row) => ({
          sql: `INSERT OR REPLACE INTO ${table.name} (${table.columns}) VALUES ${placeholders}`,
          // Mapeo explícito por nombre de columna: no dependemos del orden que
          // devuelva el driver.
          args: table.columns.split(",").map((column) => {
            const value = row[column.trim()];
            return (value ?? null) as string | number | null;
          }),
        })),
        "write",
      );
      copied += slice.length;
    }

    console.log(`  · ${table.name.padEnd(20)} ${copied} filas`);
  }

  source.close();
  target.close();
  console.log("\n✔ copia terminada\n");
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
