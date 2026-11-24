#!/usr/bin/env tsx
/** Crea/migra el esquema en la base configurada. npm run db:migrate */

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
  const { db, ensureSchema, closeDb } = await import("../src/lib/db/client");

  console.log("Base:", process.env.DATABASE_URL ?? "file:./data/league.db");
  await ensureSchema();

  const tables = await db().execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  console.log("Tablas:", tables.rows.map((r) => String(r.name)).join(", "));

  await closeDb();
  console.log("✔ esquema listo\n");
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
