import { describe, expect, it } from "vitest";
import type { MatchSummary } from "./aggregate";
import {
  isRoleFilter,
  matchesRoleFilter,
  roleFilterOf,
  roleStats,
  ROLE_LABEL,
} from "./roles";

function row(role: string, win = true, matchId = `${role}-${Math.random()}`) {
  return {
    matchId,
    puuid: "p",
    playedAt: 0,
    championId: 1,
    championName: "Ahri",
    win,
    kills: 0,
    deaths: 0,
    assists: 0,
    kda: 0,
    queueId: 420,
    queueLabel: "Solo/Duo",
    durationSeconds: 0,
    position: "—",
    role,
    cs: 0,
    gold: 0,
    vision: 0,
  } satisfies MatchSummary;
}

describe("roleFilterOf", () => {
  it("deja los roles con posición", () => {
    expect(roleFilterOf("JUNGLE")).toBe("JUNGLE");
    expect(roleFilterOf("UTILITY")).toBe("UTILITY");
  });

  it("manda lo que no es un rol a 'none'", () => {
    expect(roleFilterOf("")).toBe("none");
    expect(roleFilterOf("Invalid")).toBe("none");
    expect(roleFilterOf("NONE")).toBe("none");
  });
});

describe("isRoleFilter", () => {
  it("solo acepta valores de la URL conocidos", () => {
    expect(isRoleFilter("MIDDLE")).toBe(true);
    expect(isRoleFilter("none")).toBe(true);
    expect(isRoleFilter("middle")).toBe(false);
    expect(isRoleFilter("")).toBe(false);
    expect(isRoleFilter(undefined)).toBe(false);
    expect(isRoleFilter("SUPPORT")).toBe(false);
  });
});

describe("matchesRoleFilter", () => {
  it("cruza el rol de la partida con el filtro", () => {
    expect(matchesRoleFilter(row("TOP"), "TOP")).toBe(true);
    expect(matchesRoleFilter(row("TOP"), "JUNGLE")).toBe(false);
    expect(matchesRoleFilter(row(""), "none")).toBe(true);
    expect(matchesRoleFilter(row(""), "TOP")).toBe(false);
  });
});

describe("roleStats", () => {
  it("cuenta partidas y winrate por rol", () => {
    const stats = roleStats([
      row("JUNGLE", true),
      row("JUNGLE", false),
      row("TOP", true),
    ]);
    const jungle = stats.find((stat) => stat.role === "JUNGLE");
    expect(jungle).toMatchObject({
      label: "Jungla",
      games: 2,
      wins: 1,
      losses: 1,
      winrate: 0.5,
    });
  });

  it("ordena del más jugado al menos jugado", () => {
    const stats = roleStats([
      row("TOP"),
      row("MIDDLE"),
      row("MIDDLE"),
      row("JUNGLE"),
      row("JUNGLE"),
      row("JUNGLE"),
      row(""),
    ]);
    expect(stats.map((stat) => stat.role)).toEqual([
      "JUNGLE",
      "MIDDLE",
      "TOP",
      "none",
    ]);
  });

  it("desempata por el orden de las líneas, no por winrate", () => {
    const stats = roleStats([
      row("BOTTOM", false),
      row("TOP", true),
      row("BOTTOM", false),
      row("TOP", true),
    ]);
    expect(stats.map((stat) => stat.role)).toEqual(["TOP", "BOTTOM"]);
  });

  it("incluye 'Sin rol' para ARAM y Arena", () => {
    const stats = roleStats([row(""), row("")]);
    expect(stats).toEqual([
      {
        role: "none",
        label: ROLE_LABEL.none,
        games: 2,
        wins: 2,
        losses: 0,
        winrate: 1,
      },
    ]);
  });

  it("sin partidas devuelve una lista vacía", () => {
    expect(roleStats([])).toEqual([]);
  });
});
