#!/usr/bin/env tsx
/** Crea/migra el esquema en la base configurada. npm run db:migrate */


import { loadEnv } from "./env";

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
