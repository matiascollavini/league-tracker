import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Base de test aparte: no toca data/league.db.
const TEST_DB = "./data/vitest-rank-history.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;

import { closeDb, db, ensureSchema } from "./client";
import { getLeagueHistory, recordLeagueHistory } from "./rank-history";
import type { LeagueEntry } from "@/lib/riot/types";

const ME = "me-000000000000";

const entry = (overrides: Partial<LeagueEntry> = {}): LeagueEntry => ({
  queueType: "RANKED_SOLO_5x5",
  tier: "PLATINUM",
  rank: "II",
  leaguePoints: 64,
  wins: 120,
  losses: 110,
  ...overrides,
});

beforeAll(async () => {
  if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
  await ensureSchema();
});

afterAll(async () => {
  await closeDb();
  // En Windows el archivo puede seguir bloqueado un instante.
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      rmSync(`${TEST_DB}${suffix}`, { force: true });
    } catch {
      // ignorado
    }
  }
});

beforeEach(async () => {
  await db().execute("DELETE FROM league_history");
});

describe("recordLeagueHistory", () => {
  it("guarda una foto por cola con rango", async () => {
    await recordLeagueHistory(ME, "la2", [
      entry(),
      entry({ queueType: "RANKED_FLEX_SR", tier: "GOLD", rank: "IV", leaguePoints: 12 }),
    ]);

    const rows = await getLeagueHistory(ME, ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.queueType).sort()).toEqual([
      "RANKED_FLEX_SR",
      "RANKED_SOLO_5x5",
    ]);
  });

  it("no escribe si el rango no cambió (visitas repetidas)", async () => {
    await recordLeagueHistory(ME, "la2", [entry()], 1_000);
    await recordLeagueHistory(ME, "la2", [entry()], 2_000);
    await recordLeagueHistory(ME, "la2", [entry()], 3_000);

    expect(await getLeagueHistory(ME, ["RANKED_SOLO_5x5"])).toHaveLength(1);
  });

  it("agrega un punto cuando cambia el LP", async () => {
    await recordLeagueHistory(ME, "la2", [entry({ leaguePoints: 64 })], 1_000);
    await recordLeagueHistory(ME, "la2", [entry({ leaguePoints: 82 })], 2_000);

    const rows = await getLeagueHistory(ME, ["RANKED_SOLO_5x5"]);
    expect(rows.map((row) => row.leaguePoints)).toEqual([64, 82]);
  });

  it("solo compara contra la última foto, no contra todo el historial", async () => {
    await recordLeagueHistory(ME, "la2", [entry({ leaguePoints: 10 })], 1_000);
    await recordLeagueHistory(ME, "la2", [entry({ leaguePoints: 30 })], 2_000);
    await recordLeagueHistory(ME, "la2", [entry({ leaguePoints: 10 })], 3_000);

    expect(await getLeagueHistory(ME, ["RANKED_SOLO_5x5"])).toHaveLength(3);
  });

  it("no guarda a quien no tiene rango", async () => {
    await recordLeagueHistory(ME, "la2", [
      entry({ tier: undefined, rank: undefined, leaguePoints: undefined }),
    ]);
    expect(await getLeagueHistory(ME, ["RANKED_SOLO_5x5"])).toHaveLength(0);
  });

  it("maneja división nula (Maestro) sin duplicar", async () => {
    const master = entry({ tier: "MASTER", rank: undefined, leaguePoints: 320 });
    const fresh = entry({ tier: "MASTER", rank: undefined, leaguePoints: 320 });
    await recordLeagueHistory(ME, "la2", [master], 1_000);
    await recordLeagueHistory(ME, "la2", [fresh], 2_000);

    const rows = await getLeagueHistory(ME, ["RANKED_SOLO_5x5"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.division).toBeNull();
  });

  it("junta los alias del jugador en orden cronológico", async () => {
    await recordLeagueHistory("alias-1", "la2", [entry({ leaguePoints: 30 })], 2_000);
    await recordLeagueHistory("alias-2", "la2", [entry({ leaguePoints: 10 })], 1_000);

    const rows = await getLeagueHistory(["alias-1", "alias-2"], ["RANKED_SOLO_5x5"]);
    expect(rows.map((row) => row.leaguePoints)).toEqual([10, 30]);
  });

  it("filtra por cola", async () => {
    await recordLeagueHistory(ME, "la2", [
      entry(),
      entry({ queueType: "RANKED_FLEX_SR", tier: "GOLD", rank: "IV", leaguePoints: 12 }),
    ]);
    const flex = await getLeagueHistory(ME, ["RANKED_FLEX_SR"]);
    expect(flex).toHaveLength(1);
    expect(flex[0]?.tier).toBe("GOLD");
  });
});
