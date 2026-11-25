import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Base de test aparte: no toca data/league.db.
const TEST_DB = "./data/vitest-teammates.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;

import { closeDb, ensureSchema } from "./client";
import { resetDbForTests, saveMatch } from "./matches";
import { getTopTeammates } from "./teammates";
import type { Match, Participant } from "@/lib/riot/types";

const ME = "me-000000000000";

function player(
  overrides: Partial<Participant> & { puuid: string },
): Participant {
  return {
    championId: 103,
    championName: "Ahri",
    teamId: 100,
    win: true,
    ...overrides,
  };
}

function match(overrides: {
  matchId: string;
  participants: Participant[];
  queueId?: number;
  startTs?: number;
}): Match {
  const startTs = overrides.startTs ?? 1_700_000_000_000;
  return {
    metadata: { matchId: overrides.matchId, participants: [ME] },
    info: {
      gameCreation: startTs,
      gameStartTimestamp: startTs,
      gameDuration: 1_800,
      gameVersion: "16.23.541.1234",
      platformId: "la2",
      queueId: overrides.queueId ?? 420,
      participants: overrides.participants,
    },
  };
}

const duo = (overrides: Partial<Participant> = {}): Participant =>
  player({
    puuid: "duo-1",
    teamId: 100,
    win: true,
    riotIdGameName: "DuoUno",
    riotIdTagline: "LAS",
    profileIcon: 4568,
    ...overrides,
  });

beforeAll(async () => {
  if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
  await ensureSchema();
});

beforeEach(async () => {
  await resetDbForTests();
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

describe("getTopTeammates", () => {
  it("agrega solo a los compañeros de equipo con nombre e icono", async () => {
    await saveMatch(
      match({
        matchId: "LA2_1",
        participants: [
          player({ puuid: ME, win: true }),
          duo({ puuid: "duo-1", teamId: 100 }),
          duo({
            puuid: "rival-1",
            teamId: 200,
            win: false,
            riotIdGameName: "Rival",
          }),
        ],
      }),
      "la2",
    );

    const result = await getTopTeammates(ME);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      puuid: "duo-1",
      gameName: "DuoUno",
      tagLine: "LAS",
      platform: "la2",
      profileIcon: 4568,
      games: 1,
      wins: 1,
      losses: 0,
      winrate: 1,
    });
  });

  it("acumula victorias y derrotas en varias partidas", async () => {
    await saveMatch(
      match({
        matchId: "LA2_1",
        participants: [player({ puuid: ME, win: true }), duo({ win: true })],
        startTs: 3_000,
      }),
      "la2",
    );
    await saveMatch(
      match({
        matchId: "LA2_2",
        participants: [player({ puuid: ME, win: false }), duo({ win: false })],
        startTs: 2_000,
      }),
      "la2",
    );

    const [stat] = await getTopTeammates(ME);

    expect(stat).toMatchObject({ games: 2, wins: 1, losses: 1 });
  });

  it("respeta el filtro de cola", async () => {
    await saveMatch(
      match({
        matchId: "LA2_solo",
        participants: [player({ puuid: ME }), duo()],
        queueId: 420,
      }),
      "la2",
    );
    await saveMatch(
      match({
        matchId: "LA2_aram",
        participants: [
          player({ puuid: ME }),
          duo({ puuid: "duo-aram", riotIdGameName: "AramDuo" }),
        ],
        queueId: 450,
      }),
      "la2",
    );

    const solo = await getTopTeammates(ME, { queueIds: [420] });
    const aram = await getTopTeammates(ME, { queueIds: [450] });

    expect(solo.map((t) => t.gameName)).toEqual(["DuoUno"]);
    expect(aram.map((t) => t.gameName)).toEqual(["AramDuo"]);
  });

  it("junta los puuids reasignados del mismo Riot ID", async () => {
    await saveMatch(
      match({
        matchId: "LA2_1",
        participants: [
          player({ puuid: ME }),
          duo({ puuid: "duo-viejo", riotIdGameName: "DuoUno" }),
        ],
        startTs: 1_000,
      }),
      "la2",
    );
    await saveMatch(
      match({
        matchId: "LA2_2",
        participants: [
          player({ puuid: ME }),
          duo({ puuid: "duo-nuevo", riotIdGameName: "DuoUno" }),
        ],
        startTs: 2_000,
      }),
      "la2",
    );

    const result = await getTopTeammates(ME);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ puuid: "duo-nuevo", games: 2, wins: 2 });
  });

  it("devuelve como mucho cinco compañeros", async () => {
    const teammates = Array.from({ length: 7 }, (_, index) =>
      duo({
        puuid: `duo-${index}`,
        riotIdGameName: `Duo${index}`,
      }),
    );
    await saveMatch(
      match({
        matchId: "LA2_1",
        participants: [player({ puuid: ME }), ...teammates],
      }),
      "la2",
    );

    expect(await getTopTeammates(ME, { limit: 5 })).toHaveLength(5);
    expect(await getTopTeammates(ME, { limit: 20 })).toHaveLength(7);
  });
});
