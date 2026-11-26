import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Base de test aparte: no toca data/league.db.
const TEST_DB = "./data/vitest-cron.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;
// La tanda no sale a Riot: no hay jugadores en la cola. La key se pone igual
// porque el route se niega a correr sin ella.
process.env.RIOT_API_KEY = "test-key";

import { closeDb, ensureSchema } from "@/lib/db/client";
import { resetDbForTests } from "@/lib/db/matches";
import { GET, POST } from "./route";

const SECRET = "secreto-de-prueba";

const call = (
  init: RequestInit = {},
  url = "https://league.test/api/cron",
) => new Request(url, init);

beforeAll(async () => {
  if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
  await ensureSchema();
  process.env.CRON_SECRET = SECRET;
});

beforeEach(async () => {
  await resetDbForTests();
  process.env.CRON_SECRET = SECRET;
  process.env.RIOT_API_KEY = "test-key";
});

afterAll(async () => {
  await closeDb();
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      rmSync(`${TEST_DB}${suffix}`, { force: true });
    } catch {
      // En Windows el archivo puede seguir bloqueado un instante.
    }
  }
});

describe("/api/cron", () => {
  it("sin CRON_SECRET configurado responde 503 y no corre nada", async () => {
    delete process.env.CRON_SECRET;
    const response = await POST(call());
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("CRON_SECRET");
  });

  it("sin secreto responde 401", async () => {
    const response = await POST(call());
    expect(response.status).toBe(401);
  });

  it("con secreto equivocado responde 401", async () => {
    const response = await POST(
      call({ headers: { authorization: "Bearer otro" } }),
    );
    expect(response.status).toBe(401);
  });

  it("sin RIOT_API_KEY responde 503 (modo demo no hace ingesta)", async () => {
    delete process.env.RIOT_API_KEY;
    const response = await POST(
      call({ headers: { authorization: `Bearer ${SECRET}` } }),
    );
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("RIOT_API_KEY");
  });

  it("con el secreto correcto hace una tanda vacía y lo cuenta", async () => {
    const response = await POST(
      call({ headers: { authorization: `Bearer ${SECRET}` } }),
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      ok: boolean;
      requests: number;
      pendingBefore: number;
      pendingAfter: number;
      players: unknown[];
    };
    expect(body).toMatchObject({
      ok: true,
      requests: 0,
      pendingBefore: 0,
      pendingAfter: 0,
      players: [],
    });
  });

  it("acepta GET con ?key= (cron externos que no mandan headers)", async () => {
    const response = await GET(
      call({ method: "GET" }, `https://league.test/api/cron?key=${SECRET}`),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
