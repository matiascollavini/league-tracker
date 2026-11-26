import { describe, expect, it } from "vitest";
import {
  durationSeconds,
  pickHighlights,
  normalizeRole,
  formatDuration,
  kdaOf,
  patchOf,
  roleOrderIndex,
  summarize,
  toMatchSummaries,
  wilsonLowerBound,
} from "./aggregate";
import type { ChampionStat } from "./aggregate";
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

function stat(championName: string, games: number, wins: number): ChampionStat {
  return {
    championId: 0,
    championName,
    games,
    wins,
    losses: games - wins,
    winrate: wins / games,
    kda: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
}

describe("pickHighlights", () => {
  it("ordena los mejores por winrate ajustado y deja los peores bajo 45%", () => {
    const champions = [
      stat("Ahri", 20, 12),
      stat("Lux", 18, 8),
      stat("Jinx", 16, 11),
      stat("Darius", 14, 5),
      stat("Nami", 12, 7),
      stat("Riven", 10, 3),
      stat("Zed", 9, 5),
      stat("Sona", 8, 2),
    ];

    const { best, worst } = pickHighlights(champions);

    // Jinx 11/16 (69%), Ahri 12/20 (60%), Nami 7/12 (58%) por cota de Wilson.
    expect(best.map((c) => c.championName)).toEqual(["Jinx", "Ahri", "Nami"]);
    // Lux (44%) entra por poco; el orden es por derrotas: 10, 9 y 7.
    expect(worst.map((c) => c.championName)).toEqual(["Lux", "Darius", "Riven"]);
  });

  it("no recomienda un campeón por ganar 2 de 3 partidas", () => {
    const champions = [
      stat("Ahri", 40, 22),
      stat("Lux", 30, 16),
      stat("Jinx", 25, 13),
      stat("Darius", 20, 10),
      stat("Kaisa", 3, 2),
      stat("Yuumi", 1, 1),
    ];

    const { best, worst } = pickHighlights(champions);
    const names = [...best, ...worst].map((c) => c.championName);

    expect(names).not.toContain("Kaisa");
    expect(names).not.toContain("Yuumi");
  });

  it("un winrate alto con pocas partidas no le gana a uno menor con muestra", () => {
    // Los cuatro con 60% o más: gana el que tiene más partidas, no el 3/5.
    const champions = [
      stat("Ahri", 20, 12), // 60% en 20
      stat("Jinx", 10, 6), // 60% en 10
      stat("Darius", 16, 8), // 50% en 16
      stat("Lux", 5, 3), // 60% en 5
    ];

    const { best } = pickHighlights(champions);
    expect(best.map((c) => c.championName)).toEqual(["Ahri", "Jinx", "Darius"]);
  });

  it("la muestra mínima crece con el volumen del jugador", () => {
    const champions = [
      stat("Ahri", 200, 110),
      stat("Lux", 120, 70),
      stat("Jinx", 100, 60),
      stat("Darius", 8, 8), // 100% en 8 partidas: no alcanza (piso = 20)
    ];

    const { best } = pickHighlights(champions);
    expect(best.map((c) => c.championName)).not.toContain("Darius");
  });

  it("no muestra como peor pick un campeón con pocas partidas en 0%", () => {
    const champions = [
      stat("Ahri", 40, 25),
      stat("Nami", 18, 12),
      stat("Jinx", 20, 14),
      stat("Darius", 15, 5),
      stat("Yuumi", 2, 0),
    ];

    const { best, worst } = pickHighlights(champions);
    expect(worst.map((c) => c.championName)).not.toContain("Yuumi");
    expect(worst.map((c) => c.championName)).toEqual(["Darius"]);
    expect(best.map((c) => c.championName)).toEqual(["Jinx", "Ahri", "Nami"]);
  });

  it("un mal pick necesita 5 partidas, no 4", () => {
    expect(pickHighlights([stat("Ahri", 40, 30), stat("Warwick", 4, 1)]).worst)
      .toEqual([]);

    const { worst } = pickHighlights([
      stat("Ahri", 40, 30),
      stat("Warwick", 5, 1),
      stat("Yone", 5, 0),
    ]);
    // Yone 0/5 (5 derrotas) va antes que Warwick 1/5 (4 derrotas).
    expect(worst.map((c) => c.championName)).toEqual(["Yone", "Warwick"]);
  });

  it("un mal pick fuera del top de campeones más jugados igual aparece", () => {
    // 9 campeones con mucho volumen y el off-pool al final: mismo caso que un
    // Warwick con 6 partidas al 33% tapado por los más jugados.
    const champions = [
      stat("Fiora", 30, 18),
      stat("Sett", 28, 17),
      stat("Mordekaiser", 26, 15),
      stat("MasterYi", 24, 13),
      stat("Trundle", 22, 12),
      stat("Lillia", 20, 11),
      stat("Renekton", 18, 9),
      stat("Nautilus", 16, 9),
      stat("Malphite", 14, 8),
      stat("Warwick", 6, 2),
    ];

    const { best, worst } = pickHighlights(champions);

    expect(worst.map((c) => c.championName)).toEqual(["Warwick"]);
    expect(best.map((c) => c.championName)).not.toContain("Warwick");
  });

  it("incluye el winrate exactamente en 45% como mal pick", () => {
    const champions = [stat("Ahri", 40, 30), stat("Lux", 20, 9)];

    const { best, worst } = pickHighlights(champions);
    // 20/9 = 45% justo: entra en peores y no se repite en mejores.
    expect(worst.map((c) => c.championName)).toEqual(["Lux"]);
    expect(best.map((c) => c.championName)).toEqual(["Ahri"]);
  });

  it("ordena los malos picks por volumen, no por el peor winrate suelto", () => {
    const champions = [
      stat("Ahri", 40, 16), // 40%, el que más jugaste
      stat("Lux", 10, 2), // 20%, muchos menos partidas
    ];

    const { best, worst } = pickHighlights(champions);
    expect(worst.map((c) => c.championName)).toEqual(["Ahri", "Lux"]);
    // Un campeón de 45% o menos nunca aparece como "mejor pick".
    expect(best).toEqual([]);
  });

  it("reproduce el caso AMO LAS TET4S: Warwick, Aurora y recién después Kayle", () => {
    const champions = [
      stat("Fiora", 103, 53), // 51%
      stat("Sett", 52, 31), // 60%
      stat("Mordekaiser", 29, 16), // 55%
      stat("MasterYi", 15, 10), // 67%
      stat("Warwick", 11, 4), // 36%
      stat("Aurora", 9, 4), // 44%
      stat("Kayle", 7, 2), // 29%
      stat("Wukong", 7, 2), // 29%
      stat("Yone", 7, 2), // 29%
      stat("Jinx", 6, 1), // 17% pero sólo 6 partidas
      stat("Teemo", 5, 2), // 40%
    ];

    const { worst } = pickHighlights(champions);

    // Warwick (11) y Aurora (9) pesan más que el 1/6 de Jinx; los de 7 partidas
    // empatan y sale el primero por nombre.
    expect(worst.map((c) => c.championName)).toEqual([
      "Warwick",
      "Aurora",
      "Kayle",
    ]);
  });

  it("no repite un campeón entre mejores y peores", () => {
    const champions = [
      stat("Ahri", 10, 2), // 20%
      stat("Lux", 10, 8), // 80%
      stat("Jinx", 10, 7), // 70%
    ];

    const { best, worst } = pickHighlights(champions);
    const names = [...best, ...worst].map((c) => c.championName);

    expect(best.map((c) => c.championName)).toEqual(["Lux", "Jinx"]);
    expect(worst.map((c) => c.championName)).toEqual(["Ahri"]);
    expect(new Set(names).size).toBe(names.length);
  });

  it("sin muestra suficiente no hay picks de ningún lado", () => {
    const champions = [stat("Ahri", 3, 2), stat("Lux", 2, 2)];

    expect(pickHighlights(champions)).toEqual({ best: [], worst: [] });
  });

  it("sin campeones devuelve listas vacías", () => {
    expect(pickHighlights([])).toEqual({ best: [], worst: [] });
  });
});

describe("wilsonLowerBound", () => {
  it("castiga las muestras chicas", () => {
    expect(wilsonLowerBound(2, 3)).toBeLessThan(wilsonLowerBound(12, 20));
  });

  it("con 0 partidas devuelve 0", () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
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

describe("orden por rol en la tabla de una partida", () => {
  it("ordena TOP, JUNGLA, MID, ADC, SUPPORT", () => {
    const desordenados = ["UTILITY", "BOTTOM", "TOP", "MIDDLE", "JUNGLE"];
    expect([...desordenados].sort((a, b) => roleOrderIndex(a) - roleOrderIndex(b)))
      .toEqual(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);
  });

  it("manda al final los roles desconocidos sin desordenar el resto", () => {
    expect(roleOrderIndex("Invalid")).toBe(5);
    expect(roleOrderIndex("NONE")).toBe(5);
    expect(roleOrderIndex("")).toBe(5);
    expect(roleOrderIndex(null)).toBe(5);
    expect(roleOrderIndex("JUNGLE")).toBe(1);
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

describe("agregado con varios puuids", () => {
  it("suma las partidas registradas con el puuid viejo y el nuevo", () => {
    const viejo = "v".repeat(78);
    const nuevo = "n".repeat(78);
    const conViejo: Match = {
      ...makeMatch({ matchId: "v1", win: true }),
      info: {
        ...makeMatch({ matchId: "v1" }).info,
        participants: [
          { puuid: viejo, championId: 103, championName: "Ahri", win: true },
        ],
      },
    };
    const conNuevo: Match = {
      ...makeMatch({ matchId: "n1", win: false }),
      info: {
        ...makeMatch({ matchId: "n1" }).info,
        participants: [
          { puuid: nuevo, championId: 103, championName: "Ahri", win: false },
        ],
      },
    };

    expect(summarize([conViejo, conNuevo], viejo).matches).toBe(1);

    const ambos = summarize([conViejo, conNuevo], [viejo, nuevo]);
    expect(ambos.matches).toBe(2);
    expect(ambos.wins).toBe(1);
    expect(ambos.champions[0]?.games).toBe(2);

    // Cada fila sabe con qué puuid aparece en su partida (para el link).
    const rows = toMatchSummaries([conViejo, conNuevo], [viejo, nuevo]);
    expect(rows.map((r) => r.puuid).sort()).toEqual([nuevo, viejo]);
  });
});
