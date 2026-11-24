import { describe, expect, it } from "vitest";
import { buildMetrics, parseSide, sideParam, type ComparePlayer } from "./compare";
import type { ChampionStat, PlayerSummary } from "@/lib/riot/aggregate";

describe("parseSide", () => {
  it("parsea plataforma/nombre/tag", () => {
    expect(parseSide("la2/Carlos/RHLMC")).toEqual({
      platform: "la2",
      gameName: "Carlos",
      tagLine: "RHLMC",
    });
  });

  it("acepta nombres con espacios ya decodificados", () => {
    expect(parseSide("kr/Hide on bush/KR1")?.gameName).toBe("Hide on bush");
  });

  it("tolera valores todavía codificados", () => {
    expect(parseSide("kr/Hide%20on%20bush/KR1")?.gameName).toBe("Hide on bush");
  });

  it("rechaza formatos inválidos", () => {
    expect(parseSide(undefined)).toBeNull();
    expect(parseSide("")).toBeNull();
    expect(parseSide("la2/Carlos")).toBeNull();
    expect(parseSide("xx1/Carlos/TAG")).toBeNull();
    expect(parseSide("la2//TAG")).toBeNull();
    expect(parseSide("la2/Carlos/")).toBeNull();
  });
});

describe("sideParam", () => {
  it("codifica y vuelve a parsear igual", () => {
    const side = { platform: "la2" as const, gameName: "Hide on bush", tagLine: "KR1" };
    expect(parseSide(sideParam(side))).toEqual(side);
  });
});

function summary(overrides: Partial<PlayerSummary> = {}): PlayerSummary {
  return {
    matches: 100,
    wins: 50,
    losses: 50,
    winrate: 0.5,
    kda: 2,
    champions: [],
    from: 1,
    to: 2,
    customExcluded: 0,
    ...overrides,
  };
}

function main(name: string, games: number, winrate: number): ChampionStat {
  return {
    championId: 1,
    championName: name,
    games,
    wins: 0,
    losses: 0,
    winrate,
    kda: 1,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
}

function player(
  name: string,
  s: PlayerSummary,
  recent = { wins: 5, games: 10 },
): ComparePlayer {
  return {
    name,
    tag: "TAG",
    platform: "la2",
    summary: s,
    rank: null,
    recent,
    pool: [main("Ahri", 10, 0.7)],
  };
}

describe("buildMetrics", () => {
  it("marca ganador por winrate y KDA", () => {
    const a = player("A", summary({ winrate: 0.6, kda: 3 }));
    const b = player("B", summary({ winrate: 0.45, kda: 2 }));

    const metrics = buildMetrics(a, b);
    const winrate = metrics.find((m) => m.label === "Winrate");
    const kda = metrics.find((m) => m.label === "KDA promedio");

    expect(winrate?.winner).toBe("a");
    expect(kda?.winner).toBe("a");
  });

  it("empata cuando los números son iguales", () => {
    const a = player("A", summary({ winrate: 0.5, kda: 2 }));
    const b = player("B", summary({ winrate: 0.5, kda: 2 }));
    const metrics = buildMetrics(a, b);
    expect(metrics.find((m) => m.label === "Winrate")?.winner).toBeNull();
  });

  it("no declara ganador si alguno no tiene partidas", () => {
    const a = player("A", summary({ matches: 0, winrate: 0, kda: 0 }));
    const b = player("B", summary());
    const metrics = buildMetrics(a, b);
    expect(metrics.find((m) => m.label === "Winrate")?.winner).toBeNull();
  });
});
