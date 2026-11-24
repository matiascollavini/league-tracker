import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Base de test aparte: un archivo temporal, sin tocar data/league.db.
const TEST_DB = "./data/vitest.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;

import { closeDb, ensureSchema } from "./client";
import {
  filterKnownMatchIds,
  findSyncForPuuid,
  findSyncedPuuid,
  getPlayerMatches,
  getProgress,
  pendingMatchIds,
  registerMatchIds,
  resetDbForTests,
  rowToMatch,
  saveMatch,
  tryLockSync,
  unlockSync,
} from "./matches";
import type { Match } from "@/lib/riot/types";

const PUUID = "p".repeat(78);

function makeMatch(overrides: {
  matchId: string;
  championName?: string;
  championId?: number;
  win?: boolean;
  queueId?: number;
  startTs?: number;
  duration?: number;
}): Match {
  const {
    matchId,
    championName = "Ahri",
    championId = 103,
    win = true,
    queueId = 420,
    startTs = 1_700_000_000_000,
    duration = 1_800,
  } = overrides;

  return {
    metadata: { matchId, participants: [PUUID] },
    info: {
      gameCreation: startTs,
      gameStartTimestamp: startTs,
      gameEndTimestamp: startTs + duration * 1_000,
      gameDuration: duration,
      gameMode: "CLASSIC",
      gameVersion: "16.23.541.1234",
      queueId,
      participants: [
        {
          puuid: PUUID,
          championId,
          championName,
          win,
          kills: 7,
          deaths: 2,
          assists: 9,
          teamPosition: "MIDDLE",
        },
      ],
    },
  };
}

beforeAll(async () => {
  if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
  await ensureSchema();
});

beforeEach(async () => {
  await resetDbForTests();
});

afterAll(async () => {
  await closeDb();
  // En Windows el archivo puede seguir bloqueado un instante: da igual, está
  // gitignoreado y se pisa en la próxima corrida.
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      rmSync(`${TEST_DB}${suffix}`, { force: true });
    } catch {
      // ignorado
    }
  }
});

describe("guardado y lectura de partidas", () => {
  it("guarda una partida y la devuelve igual", async () => {
    await saveMatch(makeMatch({ matchId: "LA1_1" }), "la1");

    const matches = await getPlayerMatches(PUUID);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.metadata.matchId).toBe("LA1_1");
    expect(matches[0]?.info.participants[0]?.championName).toBe("Ahri");
    expect(matches[0]?.info.queueId).toBe(420);
    // gameEndTimestamp presente => gameDuration ya está en segundos
    expect(matches[0]?.info.gameDuration).toBe(1_800);
  });

  it("es idempotente: guardar dos veces no duplica", async () => {
    await saveMatch(makeMatch({ matchId: "LA1_1" }), "la1");
    await saveMatch(makeMatch({ matchId: "LA1_1", win: false }), "la1");

    const matches = await getPlayerMatches(PUUID);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.info.participants[0]?.win).toBe(false);
  });

  it("ordena de la más nueva a la más vieja", async () => {
    await saveMatch(makeMatch({ matchId: "vieja", startTs: 1_000 }), "la1");
    await saveMatch(makeMatch({ matchId: "nueva", startTs: 2_000 }), "la1");

    const matches = await getPlayerMatches(PUUID);
    expect(matches.map((m) => m.metadata.matchId)).toEqual(["nueva", "vieja"]);
  });

  it("respeta el límite", async () => {
    for (let i = 0; i < 5; i++) {
      await saveMatch(
        makeMatch({ matchId: `m${i}`, startTs: 1_000 + i * 1_000 }),
        "la1",
      );
    }
    expect(await getPlayerMatches(PUUID, 2)).toHaveLength(2);
  });
});

describe("progreso del historial", () => {
  it("distingue conocidas de analizadas", async () => {
    await registerMatchIds(PUUID, ["a", "b", "c"]);
    await saveMatch(makeMatch({ matchId: "a" }), "la1");

    const progress = await getProgress(PUUID);
    expect(progress).toEqual({ known: 3, detailed: 1 });
  });

  it("devuelve como pendientes solo las que no tienen detalle", async () => {
    await registerMatchIds(PUUID, ["a", "b", "c"]);
    await saveMatch(makeMatch({ matchId: "b" }), "la1");

    const pending = await pendingMatchIds(PUUID, 10);
    expect(pending.sort()).toEqual(["a", "c"]);
    expect(await pendingMatchIds(PUUID, 0)).toEqual([]);
  });

  it("filtra los IDs que ya están guardados", async () => {
    await saveMatch(makeMatch({ matchId: "a" }), "la1");
    const known = await filterKnownMatchIds(["a", "b"]);
    expect(known).toEqual(["a"]);
  });
});

describe("búsqueda de datos guardados", () => {
  it("encuentra al jugador por puuid aunque la plataforma sea otra", async () => {
    await saveMatch(makeMatch({ matchId: "LA2_1" }), "la2");
    await registerMatchIds(PUUID, ["LA2_1"]);
    const { touchSyncState } = await import("./matches");
    await touchSyncState(PUUID, "la2", {
      gameName: "Carlos",
      tagLine: "RHLMC",
      backfillState: "done",
    });

    const owner = await findSyncForPuuid(PUUID);
    expect(owner?.platform).toBe("la2");
    expect(owner?.gameName).toBe("Carlos");
  });

  it("encuentra al jugador por Riot ID sin importar la región", async () => {
    await saveMatch(makeMatch({ matchId: "LA2_2" }), "la2");
    await registerMatchIds(PUUID, ["LA2_2"]);
    const { touchSyncState } = await import("./matches");
    await touchSyncState(PUUID, "la2", {
      gameName: "Carlos",
      tagLine: "RHLMC",
      backfillState: "done",
    });

    // se busca como si el usuario hubiera elegido LAN
    const owner = await findSyncedPuuid("Carlos", "RHLMC");
    expect(owner?.puuid).toBe(PUUID);
    expect(owner?.platform).toBe("la2");
  });

  it("no devuelve nada si no hay partidas guardadas", async () => {
    expect(await findSyncForPuuid(PUUID)).toBeNull();
    expect(await findSyncedPuuid("Nadie", "XXXX")).toBeNull();
  });
});

describe("lock de sincronización", () => {
  it("solo un proceso se queda con el lock", async () => {
    const first = await tryLockSync(PUUID, "la1", 60);
    const second = await tryLockSync(PUUID, "la1", 60);

    expect(first).toBeTruthy();
    expect(second).toBeNull();

    await unlockSync(PUUID, first!);
    expect(await tryLockSync(PUUID, "la1", 60)).toBeTruthy();
  });

  it("un lock vencido se puede tomar", async () => {
    const first = await tryLockSync(PUUID, "la1", -1); // ya vencido
    expect(first).toBeNull();
    expect(await tryLockSync(PUUID, "la1", 60)).toBeTruthy();
  });
});

describe("rowToMatch", () => {
  it("reconstruye un Match desde una fila de SQL", () => {
    const match = rowToMatch({
      match_id: "LA2_1",
      puuid: PUUID,
      queue_id: 420,
      game_mode: "CLASSIC",
      game_version: "16.23.1.1",
      game_start_ts: 1_700_000_000_000,
      game_duration_s: 1_800,
      champion_id: 103,
      champion_name: "Ahri",
      team_id: 100,
      team_position: "MIDDLE",
      win: 1,
      kills: 3,
      deaths: 1,
      assists: 4,
    });

    expect(match.metadata.matchId).toBe("LA2_1");
    expect(match.info.participants[0]?.win).toBe(true);
    expect(match.info.gameDuration).toBe(1_800);
  });
});
