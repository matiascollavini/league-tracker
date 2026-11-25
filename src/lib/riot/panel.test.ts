import { describe, expect, it } from "vitest";
import { groupTeams, parsePanelTeams, roleLabel, toPanelPlayer } from "./panel";
import type { Participant } from "./types";

const PUUID = "p".repeat(78);

function participant(overrides: Partial<Participant> = {}): Participant {
  return {
    puuid: PUUID,
    championId: 103,
    championName: "Ahri",
    teamId: 100,
    teamPosition: "MIDDLE",
    win: true,
    kills: 3,
    deaths: 1,
    assists: 5,
    goldEarned: 12_345,
    totalMinionsKilled: 120,
    neutralMinionsKilled: 10,
    visionScore: 18,
    totalDamageDealtToChampions: 21_000,
    riotIdGameName: "Prueba",
    riotIdTagline: "LAS",
    ...overrides,
  };
}

describe("toPanelPlayer", () => {
  it("arma el Riot ID y suma minions de línea y jungla en CS", () => {
    const player = toPanelPlayer(participant());
    expect(player.riotId).toBe("Prueba#LAS");
    expect(player.cs).toBe(130);
    expect(player.gold).toBe(12_345);
    expect(player.position).toBe("MIDDLE");
  });

  it("sin Riot ID deja null (Riot omite los campos vacíos)", () => {
    const player = toPanelPlayer(
      participant({ riotIdGameName: undefined, riotIdTagline: undefined }),
    );
    expect(player.riotId).toBeNull();
  });

  it("trata los números opcionales como 0", () => {
    const player = toPanelPlayer(
      participant({
        kills: undefined,
        deaths: undefined,
        assists: undefined,
        goldEarned: undefined,
        totalMinionsKilled: undefined,
        neutralMinionsKilled: undefined,
        visionScore: undefined,
        totalDamageDealtToChampions: undefined,
      }),
    );
    expect([player.kills, player.cs, player.gold, player.damage]).toEqual([
      0, 0, 0, 0,
    ]);
  });
});

describe("groupTeams", () => {
  it("separa en dos equipos y ordena por línea", () => {
    const teams = groupTeams([
      toPanelPlayer(participant({ puuid: "a", teamPosition: "UTILITY" })),
      toPanelPlayer(participant({ puuid: "b", teamPosition: "TOP" })),
      toPanelPlayer(
        participant({ puuid: "c", teamId: 200, win: false, teamPosition: "JUNGLE" }),
      ),
    ]);

    expect(teams).toHaveLength(2);
    expect(teams[0]?.teamId).toBe(100);
    expect(teams[0]?.win).toBe(true);
    expect(teams[0]?.players.map((p) => p.puuid)).toEqual(["b", "a"]);
    // El equipo rojo perdió: el win sale de sus propios jugadores.
    expect(teams[1]?.win).toBe(false);
  });

  it("manda los roles desconocidos al final, sin romper", () => {
    const teams = groupTeams([
      toPanelPlayer(participant({ puuid: "x", teamPosition: "" })),
      toPanelPlayer(participant({ puuid: "y", teamPosition: "MIDDLE" })),
    ]);
    expect(teams[0]?.players.map((p) => p.puuid)).toEqual(["y", "x"]);
  });
});

describe("roleLabel", () => {
  it("traduce las posiciones de Riot", () => {
    expect(roleLabel("UTILITY")).toBe("Support");
    expect(roleLabel(null)).toBe("—");
  });
});

describe("parsePanelTeams", () => {
  const teams = groupTeams([
    toPanelPlayer(participant()),
    toPanelPlayer(participant({ puuid: "b", teamId: 200, win: false })),
  ]);

  it("acepta la respuesta del endpoint", () => {
    expect(parsePanelTeams({ teams })).toEqual(teams);
  });

  it("descarta basura en vez de romper el render", () => {
    expect(parsePanelTeams(null)).toBeNull();
    expect(parsePanelTeams({})).toBeNull();
    expect(parsePanelTeams({ teams: [] })).toBeNull();
    expect(parsePanelTeams({ teams: [{ teamId: "100", win: true, players: [] }] })).toBeNull();
    expect(parsePanelTeams({ teams: [{ teamId: 100, win: true, players: [{}] }] })).toBeNull();
  });
});
