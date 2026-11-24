import { NextResponse } from "next/server";
import { databaseHost, db, dbConfig, ensureSchema } from "@/lib/db/client";
import { hasApiKey, isMockMode } from "@/lib/riot/http";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico público y sin secretos: sirve para confirmar a qué base está
 * conectado el deploy y cuánto datos tiene.
 *
 *   /api/health
 */
export async function GET() {
  try {
    await ensureSchema();
    const c = db();

    const counts = await c.execute({
      sql: `SELECT
              (SELECT COUNT(*) FROM matches) AS matches,
              (SELECT COUNT(*) FROM puuid_sync) AS players,
              (SELECT COUNT(*) FROM puuid_sync
                WHERE backfill_state <> 'done') AS pending_players`,
    });
    const row = counts.rows[0];
    const version = await c.execute({
      sql: "SELECT value FROM meta WHERE key = ?",
      args: ["schema_version"],
    });

    const config = dbConfig();
    return NextResponse.json({
      ok: true,
      database: {
        host: databaseHost(),
        urlFrom: config.urlSource,
        tokenFrom: config.tokenSource ?? null,
        schemaVersion: Number(version.rows[0]?.value ?? 0),
      },
      data: {
        matches: Number(row?.matches ?? 0),
        players: Number(row?.players ?? 0),
        pendingPlayers: Number(row?.pending_players ?? 0),
      },
      riot: {
        hasKey: hasApiKey(),
        mode: isMockMode() ? "demo" : hasApiKey() ? "real" : "sin key",
        onDemandBudget: Number(process.env.RIOT_ONDEMAND_BUDGET ?? 25),
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL === "1",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        database: { host: databaseHost(), urlFrom: dbConfig().urlSource },
      },
      { status: 500 },
    );
  }
}
