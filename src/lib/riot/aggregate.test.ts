import { describe, expect, it } from "vitest";
import {
  durationSeconds,
  normalizeRole,
  formatDuration,
  kdaOf,
  patchOf,
  summarize,
  toMatchSummaries,
} from "./aggregate";
import type { Match } from "./types";

const PUUID = "p".repeat(78);

function makeMatch(
  overrides: Partial<{
    matchId: string;
    championId: number;
    championName: string;
    win: boolean;
    queueId: number;
    duration: number;
    gameEndTimestamp: number | null;
    gameStartTimestamp: number;
    kills: number;
    deaths: number;
    assists: number;
    gameVersion: string;
  }> = {},
): Match {
  const {
    matchId = "LA1_1",
    championId = 103,
    championName = "Ahri",
    win = true,
    queueId = 420,
    duration = 1_800,
    gameEndTimestamp = 1_700_000_000_000,
    gameStartTimestamp = 1_690_000_000_000,
    kills = 7,
    deaths = 2,
    assists = 9,
    gameVersion = "16.23.541.1234",
  } = overrides;

  return {
    metadata: { matchId, participants: [PUUID] },
    info: {
      gameCreation: gameStartTimestamp - 60_000,
      gameStartTimestamp,
      ...(gameEndTimestamp != null ? { gameEndTimestamp } : {}),
      gameDuration: duration,
      gameMode: "CLASSIC",
      gameType: "MATCHED_GAME",
      gameVersion,
      queueId,
      participants: [
        {
          puuid: PUUID,
          championId,
          championName,
          win,
          kills,
          deaths,
          assists,
          teamPosition: "MIDDLE",
        },
      ],
    },
  };
}

describe("durationSeconds", () => {
  it("usa gameDuration como segundos cuando existe gameEndTimestamp", () => {
    expect(durationSeconds(makeMatch({ duration: 1_832 }).info)).toBe(1_832);
  });

  it("divide por 1000 en partidas viejas (sin gameEndTimestamp)", () => {
    const info = makeMatch({
      duration: 1_832_000,
      gameEndTimestamp: null,
    }).info;
    expect(durationSeconds(info)).toBe(1_832);
  });
});

describe("patchOf", () => {
  it("devuelve major.minor", () => {
    expect(patchOf("16.23.541.1234")).toBe("16.23");
  });
});

describe("kdaOf", () => {
  it("no divide por cero", () => {
    expect(kdaOf(5, 0, 5)).toBe(10);
    expect(kdaOf(3, 3, 6)).toBe(3);
  });
});

describe("summarize", () => {
  it("agrupa por championName y acumula winrate", () => {
    const matches = [
      makeMatch({ matchId: "m1", championName: "Ahri", win: true }),
      makeMatch({ matchId: "m2", championName: "Ahri", win: false }),
      makeMatch({ matchId: "m3", championName: "Jinx", championId: 222, win: true }),
    ];

    const summary = summarize(matches, PUUID);

    expect(summary.matches).toBe(3);
    expect(summary.wins).toBe(2);
    expect(summary.winrate).toBeCloseTo(2 / 3);
    expect(summary.champions[0]?.championName).toBe("Ahri");
    expect(summary.champions[0]?.games).toBe(2);
    expect(summary.champions[0]?.winrate).toBe(0.5);
  });

  it("agrupa por championName aunque el championId venga mal (pre-11.4)", () => {
    // Dos partidas del mismo campeón con championId distinto (dato corrupto):
    // si agrupáramos por id, aparecerían como dos campeones.
    const matches = [
      makeMatch({ matchId: "old1", championName: "Ahri", championId: 0, gameVersion: "10.9.1.1" }),
      makeMatch({ matchId: "old2", championName: "Ahri", championId: 999, gameVersion: "10.9.1.1" }),
    ];

    const summary = summarize(matches, PUUID);
    expect(summary.champions).toHaveLength(1);
    expect(summary.champions[0]?.games).toBe(2);
  });

  it("excluye partidas custom por defecto", () => {
    const matches = [
      makeMatch({ matchId: "m1", queueId: 420 }),
      makeMatch({ matchId: "m2", queueId: 0 }),
    ];

    const summary = summarize(matches, PUUID);
    expect(summary.matches).toBe(1);
    expect(summary.customExcluded).toBe(1);

    const withCustoms = summarize(matches, PUUID, { excludeCustoms: false });
    expect(withCustoms.matches).toBe(2);
  });

  it("ignora partidas donde no participó el puuid", () => {
    const foreign = makeMatch({ matchId: "foreign" });
    foreign.info.participants[0]!.puuid = "otro";
    expect(summarize([foreign], PUUID).matches).toBe(0);
  });

  it("ordena por partidas y desempata por winrate", () => {
    const matches = [
      makeMatch({ matchId: "a1", championName: "Lux", win: true }),
      makeMatch({ matchId: "b1", championName: "Darius", win: true }),
      makeMatch({ matchId: "b2", championName: "Darius", win: true }),
      makeMatch({ matchId: "a2", championName: "Lux", win: false }),
    ];

    const summary = summarize(matches, PUUID);
    expect(summary.champions.map((c) => c.championName)).toEqual(["Darius", "Lux"]);
  });
});

describe("toMatchSummaries", () => {
  it("ordena de más nueva a más vieja y arma el resumen", () => {
    const matches = [
      makeMatch({ matchId: "vieja", gameStartTimestamp: 1_000 }),
      makeMatch({ matchId: "nueva", gameStartTimestamp: 2_000 }),
    ];

    const rows = toMatchSummaries(matches, PUUID);
    expect(rows.map((r) => r.matchId)).toEqual(["nueva", "vieja"]);
    expect(rows[0]?.queueLabel).toBe("Solo/Duo");
    expect(rows[0]?.position).toBe("Mid");
  });
});

describe("formatDuration", () => {
  it("formatea mm:ss", () => {
    expect(formatDuration(1_832)).toBe("30:32");
    expect(formatDuration(59)).toBe("0:59");
  });
});

describe("rol", () => {
  it("ARAM, Arena y custom no tienen rol: Riot manda 'Invalid' y no se cuenta", () => {
    expect(normalizeRole("Invalid")).toBe("");
    expect(normalizeRole("")).toBe("");
    expect(normalizeRole("NONE")).toBe("");
    expect(normalizeRole("UTILITY")).toBe("UTILITY");
  });

  it("toMatchSummaries deja el rol vacío en partidas sin posiciones", () => {
    const aram: Match = {
      ...makeMatch({ matchId: "a" }),
      info: {
        ...makeMatch({ matchId: "a" }).info,
        queueId: 450,
        participants: [
          {
            puuid: PUUID,
            championId: 103,
            championName: "Ahri",
            win: true,
            teamPosition: "Invalid",
          },
        ],
      },
    };
    expect(toMatchSummaries([aram], PUUID)[0]?.role).toBe("");
  });
});
