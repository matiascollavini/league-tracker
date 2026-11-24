#!/usr/bin/env tsx
/**
 * Rellena el nombre de los participantes en partidas viejas (guardadas antes de
 * que existiera la columna riot_id). No borra nada: re-guarda la partida.
 *
 *   npm run repair:names            (todas)
 *   npm run repair:names -- --limit=20
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const raw = m[2];
    if (!key || raw == null) continue;
    if (!(key in process.env)) process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadEnv();
  if (!process.env.RIOT_API_KEY?.trim()) {
    console.error("\nFalta RIOT_API_KEY en .env.local\n");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 5_000;

  const { db, ensureSchema, closeDb } = await import("../src/lib/db/client");
  const { saveMatch } = await import("../src/lib/db/matches");
  const { getMatch } = await import("../src/lib/riot/matches");
  const { isPlatform } = await import("../src/lib/riot/config");

  await ensureSchema();
  const pending = await db().execute({
    sql: `SELECT DISTINCT match_id FROM match_participants
           WHERE riot_id IS NULL LIMIT ?`,
    args: [limit],
  });

  console.log(`\nPartidas a reparar: ${pending.rows.length}\n`);
  let done = 0;

  for (const row of pending.rows) {
    const matchId = String(row.match_id);
    const prefix = matchId.split("_")[0]?.toLowerCase() ?? "";
    if (!isPlatform(prefix)) {
      console.log(`  · ${matchId}: plataforma desconocida, salteada`);
      continue;
    }
    try {
      const match = await getMatch(matchId, prefix);
      await saveMatch(match, prefix);
      done += 1;
      if (done % 10 === 0) console.log(`  · ${done} reparadas`);
    } catch (error) {
      console.log(
        `  · ${matchId}: ${error instanceof Error ? error.message : "error"}`,
      );
    }
  }

  console.log(`\n  ✔ ${done} partidas reparadas\n`);
  await closeDb();
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
