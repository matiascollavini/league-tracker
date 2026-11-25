import { describe, expect, it } from "vitest";
import type { Match, Participant } from "./types";
import { mergeTeammates, topTeammatesFromMatches } from "./teammates";

const ME = "me-000000000000";
const ALIAS = "me-alias-000000";

function player(overrides: Partial<Participant> & { puuid: string }): Participant {
  return {
    championId: 103,
    championName: "Ahri",
    teamId: 100,
    win: true,
    ...overrides,
  };
}

function match(
  matchId: string,
  participants: Participant[],
  startTs = 1_700_000_000_000,
  platformId = "LA1",
): Match {
  return {
    metadata: { matchId, participants: [ME] },
    info: {
      gameCreation: startTs,
      gameStartTimestamp: startTs,
      gameDuration: 1_800,
      gameVersion: "16.23.541.1234",
      platformId,
      queueId: 420,
      participants,
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

describe("topTeammatesFromMatches", () => {
  it("cuenta solo a los del mismo equipo y no al jugador", () => {
    const matches = [
      match("m1", [
        player({ puuid: ME, teamId: 100 }),
        duo({ puuid: "duo-1", teamId: 100 }),
        duo({
          puuid: "rival-1",
          teamId: 200,
          win: false,
          riotIdGameName: "Rival",
        }),
      ]),
    ];

    const result = topTeammatesFromMatches(matches, [ME]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      puuid: "duo-1",
      gameName: "DuoUno",
      tagLine: "LAS",
      games: 1,
      wins: 1,
      losses: 0,
      winrate: 1,
      platform: "la1",
    });
  });

  it("excluye los alias del propio jugador", () => {
    const matches = [
      match("m1", [
        player({ puuid: ME }),
        player({ puuid: ALIAS, riotIdGameName: "YoMismo" }),
        duo(),
      ]),
    ];

    const result = topTeammatesFromMatches(matches, [ME, ALIAS]);

    expect(result.map((t) => t.puuid)).toEqual(["duo-1"]);
  });

  it("acumula partidas, victorias y derrotas", () => {
    const matches = [
      match("m1", [player({ puuid: ME, win: true }), duo()], 3_000),
      match("m2", [player({ puuid: ME, win: false }), duo({ win: false })], 2_000),
      match("m3", [player({ puuid: ME, win: false }), duo({ win: false })], 1_000),
    ];

    const [stat] = topTeammatesFromMatches(matches, [ME]);

    expect(stat).toMatchObject({ games: 3, wins: 1, losses: 2 });
    expect(stat?.winrate).toBeCloseTo(1 / 3);
  });

  it("junta los puuids que Riot reasignó para el mismo Riot ID", () => {
    const matches = [
      match("m1", [
        player({ puuid: ME }),
        duo({ puuid: "duo-viejo", riotIdGameName: "DuoUno" }),
      ]),
      match("m2", [
        player({ puuid: ME }),
        duo({ puuid: "duo-nuevo", riotIdGameName: "DuoUno" }),
      ]),
    ];

    const result = topTeammatesFromMatches(matches, [ME]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ puuid: "duo-nuevo", games: 2 });
  });

  it("se queda con el nombre e icono de la partida más nueva", () => {
    const matches = [
      match(
        "nueva",
        [
          player({ puuid: ME }),
          duo({
            puuid: "duo-1",
            riotIdGameName: "NombreNuevo",
            profileIcon: 1111,
          }),
        ],
        2_000,
      ),
      match(
        "vieja",
        [
          player({ puuid: ME }),
          duo({
            puuid: "duo-1",
            riotIdGameName: "NombreViejo",
            profileIcon: 2222,
          }),
        ],
        1_000,
      ),
    ];

    const [stat] = topTeammatesFromMatches(matches, [ME]);

    expect(stat).toMatchObject({
      gameName: "NombreNuevo",
      profileIcon: 1111,
      lastPlayedAt: 2_000,
    });
  });

  it("rescata el icono de una partida vieja si la nueva no lo trae", () => {
    const matches = [
      match(
        "nueva",
        [
          player({ puuid: ME }),
          duo({ puuid: "duo-1", profileIcon: undefined }),
        ],
        2_000,
      ),
      match(
        "vieja",
        [player({ puuid: ME }), duo({ puuid: "duo-1", profileIcon: 2222 })],
        1_000,
      ),
    ];

    const [stat] = topTeammatesFromMatches(matches, [ME]);

    expect(stat?.profileIcon).toBe(2222);
  });

  it("ordena por partidas y devuelve como mucho cinco", () => {
    const teammates = Array.from({ length: 6 }, (_, index) =>
      duo({
        puuid: `duo-${index}`,
        riotIdGameName: `Duo${index}`,
      }),
    );
    // El 5 aparece en 2 partidas; el resto en 1.
    const matches = [
      match("m1", [player({ puuid: ME }), ...teammates]),
      match("m2", [player({ puuid: ME }), teammates[5]!]),
    ];

    const result = topTeammatesFromMatches(matches, [ME], 5);

    expect(result).toHaveLength(5);
    expect(result[0]?.gameName).toBe("Duo5");
    expect(result[0]?.games).toBe(2);
  });

  it("sin partidas devuelve una lista vacía", () => {
    expect(topTeammatesFromMatches([], [ME])).toEqual([]);
  });
});

describe("mergeTeammates", () => {
  it("suma los agregados de SQL de dos puuids del mismo Riot ID", () => {
    const result = mergeTeammates(
      [
        {
          puuid: "viejo",
          gameName: "Duo",
          tagLine: "LAS",
          platform: "la2",
          profileIcon: 1,
          games: 10,
          wins: 6,
          lastPlayedAt: 1_000,
        },
        {
          puuid: "nuevo",
          gameName: "Duo",
          tagLine: "LAS",
          platform: "la2",
          profileIcon: 2,
          games: 5,
          wins: 2,
          lastPlayedAt: 2_000,
        },
      ],
      5,
    );

    expect(result).toEqual([
      {
        puuid: "nuevo",
        gameName: "Duo",
        tagLine: "LAS",
        platform: "la2",
        profileIcon: 2,
        games: 15,
        wins: 8,
        losses: 7,
        winrate: 8 / 15,
        lastPlayedAt: 2_000,
      },
    ]);
  });
});
