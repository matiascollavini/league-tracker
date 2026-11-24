#!/usr/bin/env tsx
/** Resumen de lo que hay guardado: npm run db:stats */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const raw = match[2];
    if (!key || raw == null) continue;
    if (!(key in process.env)) process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadEnv();
  const { db, ensureSchema, closeDb } = await import("../src/lib/db/client");
  await ensureSchema();

  const c = db();
  const matches = await c.execute("SELECT COUNT(*) AS n FROM matches");
  const participants = await c.execute(
    "SELECT COUNT(*) AS n FROM match_participants",
  );
  const players = await c.execute(
    "SELECT COUNT(DISTINCT puuid) AS n FROM puuid_matches",
  );
  const size = await c.execute(
    "SELECT SUM(pgsize) AS bytes FROM dbstat WHERE name NOT LIKE 'sqlite_%'",
  ).catch(() => null);
  const top = await c.execute(
    `SELECT ps.game_name, ps.tag_line, ps.platform_id,
            (SELECT COUNT(*) FROM puuid_matches pm WHERE pm.puuid = ps.puuid) AS known,
            (SELECT COUNT(*) FROM puuid_matches pm
               JOIN matches m ON m.match_id = pm.match_id
              WHERE pm.puuid = ps.puuid) AS detailed
       FROM puuid_sync ps
      ORDER BY detailed DESC
      LIMIT 10`,
  );

  const n = (row: unknown, key: string) => Number((row as Record<string, unknown>)?.[key] ?? 0);

  console.log("\nBase de datos:", process.env.DATABASE_URL ?? "file:./data/league.db");
  console.log(`  partidas           : ${n(matches.rows[0], "n")}`);
  console.log(`  participantes      : ${n(participants.rows[0], "n")}`);
  console.log(`  jugadores          : ${n(players.rows[0], "n")}`);
  if (size) {
    const bytes = n(size.rows[0], "bytes");
    console.log(
      `  tamaño             : ${(bytes / 1024 / 1024).toFixed(2)} MB (con índices)`,
    );
  }

  if (top.rows.length > 0) {
    console.log("\n  jugador                    plataforma   detalle/conocidas");
    for (const row of top.rows) {
      const name = `${String(row.game_name ?? "?")}#${String(row.tag_line ?? "?")}`;
      console.log(
        `  ${name.padEnd(26)} ${String(row.platform_id ?? "").padEnd(12)} ${String(row.detailed)}/${String(row.known)}`,
      );
    }
  }
  console.log("");
  await closeDb();
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
