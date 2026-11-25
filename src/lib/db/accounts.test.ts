import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Base de test aparte: no toca data/league.db.
const TEST_DB = "./data/vitest-accounts.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;

import { closeDb, ensureSchema } from "./client";
import {
  accountUpsertStatement,
  countAccounts,
  saveAccount,
  searchAccounts,
  splitRiotId,
} from "./accounts";
import { resetDbForTests, saveMatch } from "./matches";
import type { Match } from "@/lib/riot/types";

beforeAll(async () => {
  if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
  await ensureSchema();
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

beforeEach(async () => {
  await resetDbForTests();
});

const account = (
  puuid: string,
  gameName: string,
  tagLine: string,
  extra: { platformId?: string; lastSeenTs?: number } = {},
) => ({
  puuid,
  platformId: extra.platformId ?? "la2",
  gameName,
  tagLine,
  lastSeenTs: extra.lastSeenTs ?? 0,
});

describe("splitRiotId", () => {
  it("corta por el último # y admite nombres con espacios", () => {
    expect(splitRiotId("  The Faker #KR1 ")).toEqual({
      name: "The Faker",
      tag: "KR1",
    });
  });

  it("sin # devuelve solo el nombre", () => {
    expect(splitRiotId("Faker")).toEqual({ name: "Faker", tag: null });
  });

  it("# al final equivale a no tener tag", () => {
    expect(splitRiotId("Faker#")).toEqual({ name: "Faker", tag: null });
  });
});

describe("searchAccounts", () => {
  it("busca por prefijo sin distinguir mayúsculas", async () => {
    await saveAccount(account("p1", "Faker", "KR1", { platformId: "kr" }));
    await saveAccount(account("p2", "Fakerito", "LAS"));

    const hits = await searchAccounts("FAKER");
    expect(hits.map((hit) => hit.gameName)).toEqual(["Faker", "Fakerito"]);
  });

  it("devuelve el nombre exacto primero y respeta el límite", async () => {
    await saveAccount(account("p1", "Faker", "KR1", { platformId: "kr" }));
    await saveAccount(account("p2", "Fakerito", "LAS"));
    await saveAccount(account("p3", "FakerFan", "LAN"));

    const hits = await searchAccounts("faker", { limit: 2 });
    expect(hits).toHaveLength(2);
    expect(hits[0]?.gameName).toBe("Faker");
  });

  it("filtra por tag cuando el usuario escribe Nombre#TAG", async () => {
    await saveAccount(account("p1", "Faker", "KR1", { platformId: "kr" }));
    await saveAccount(account("p2", "Faker", "LAS"));

    const hits = await searchAccounts("Faker#kr");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.tagLine).toBe("KR1");
  });

  it("trata % y _ como literales (no son comodines de SQL)", async () => {
    await saveAccount(account("p1", "100%Real", "LAS"));
    await saveAccount(account("p2", "100XReal", "LAS"));

    const hits = await searchAccounts("100%");
    expect(hits.map((hit) => hit.gameName)).toEqual(["100%Real"]);
  });

  it("no devuelve nada con menos de 2 caracteres", async () => {
    await saveAccount(account("p1", "Faker", "KR1", { platformId: "kr" }));
    expect(await searchAccounts("f")).toEqual([]);
  });

  it("acota a una plataforma si se pide", async () => {
    await saveAccount(account("p1", "Faker", "KR1", { platformId: "kr" }));
    await saveAccount(account("p2", "Faker", "LAS"));

    const hits = await searchAccounts("Faker", { platform: "la2" });
    expect(hits.map((hit) => hit.platformId)).toEqual(["la2"]);
  });

  it("un nombre viejo no pisa al más nuevo, pero el nuevo sí actualiza", async () => {
    await saveAccount(
      account("p1", "NombreViejo", "LAS", { lastSeenTs: 1_000 }),
    );
    await saveAccount(
      account("p1", "NombreNuevo", "LAS", { lastSeenTs: 2_000 }),
    );
    // Partida vieja que llega después (el ingest baja de nuevo a viejo).
    await saveAccount(
      account("p1", "NombreViejo", "LAS", { lastSeenTs: 500 }),
    );

    const hits = await searchAccounts("Nombre");
    expect(hits.map((hit) => hit.gameName)).toEqual(["NombreNuevo"]);
  });

  it("el upsert conserva icono y nivel si la fila nueva no los trae", async () => {
    await saveAccount({
      ...account("p1", "Faker", "KR1", { lastSeenTs: 1_000 }),
      profileIcon: 4568,
      level: 312,
    });
    await saveAccount(account("p1", "Faker", "KR1", { lastSeenTs: 2_000 }));

    const [hit] = await searchAccounts("Faker");
    expect(hit?.profileIcon).toBe(4568);
    expect(hit?.level).toBe(312);
  });

  it("descarta filas sin nombre o sin tag", async () => {
    await saveAccount(account("p1", "", "KR1"));
    await saveAccount(account("p2", "Faker", ""));
    expect(await countAccounts()).toBe(0);
  });
});

describe("saveMatch alimenta el índice", () => {
  const puuid = "a".repeat(78);

  function match(): Match {
    return {
      metadata: { matchId: "LA2_1", participants: [puuid] },
      info: {
        gameCreation: 1_700_000_000_000,
        gameStartTimestamp: 1_700_000_000_000,
        gameEndTimestamp: 1_700_001_800_000,
        gameDuration: 1_800,
        gameMode: "CLASSIC",
        gameVersion: "16.23.1",
        queueId: 420,
        participants: [
          {
            puuid,
            championId: 103,
            championName: "Ahri",
            teamId: 100,
            teamPosition: "MIDDLE",
            win: true,
            riotIdGameName: "Keke",
            riotIdTagline: "6seve",
            profileIcon: 1234,
            summonerLevel: 87,
          },
        ],
      },
    };
  }

  it("guarda los 10 participantes con su plataforma e icono", async () => {
    await saveMatch(match(), "la2");

    const [hit] = await searchAccounts("kek");
    expect(hit).toMatchObject({
      puuid,
      gameName: "Keke",
      tagLine: "6seve",
      platformId: "la2",
      profileIcon: 1234,
      level: 87,
    });
  });

  it("el statement suelto y el batch coinciden en forma", () => {
    const statement = accountUpsertStatement({
      puuid,
      platformId: "la2",
      gameName: "Keke",
      tagLine: "6seve",
    });
    expect(statement.args).toHaveLength(9);
    expect(statement.sql).toContain("ON CONFLICT(puuid)");
  });
});
