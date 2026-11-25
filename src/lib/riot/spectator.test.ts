import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findActiveGame, getActiveGame, toLiveGame } from "./spectator";
import type { ActiveGame } from "./types";

/**
 * Payload REAL (2026-11-25, la2, ranked soloQ), recortado a 4 de los 10
 * participantes para que se lea. Se mantuvieron los campos tal como llegaron,
 * incluidos los NO documentados (`riotId`, `lastSelectedSkinIndex`).
 */
const KekePuuid =
  "077q-0aRXUnDN3ttneb7cAUTIO8mZ7w74KsFujRBD6sRTmAuI8E7fOQoquhpZvbhkvdslBTPgt4uzg";

const liveGamePayload: ActiveGame = {
  gameId: 1639879656,
  mapId: 11,
  gameMode: "CLASSIC",
  gameType: "MATCHED",
  gameQueueConfigId: 420,
  platformId: "LA2",
  gameStartTime: 1795594139825,
  gameLength: 1246,
  participants: [
    {
      puuid:
        "YEXxBgtrf2VXJPkLhdGf8fmtAmMOQ_iL-YHO04ONG_sUWRImN7rQQd82lk7ms66QebguxqvP4HGBZw",
      teamId: 100,
      spell1Id: 6,
      spell2Id: 4,
      championId: 10,
      profileIconId: 6752,
      riotId: "ThousandSunnyy#soad",
      bot: false,
    },
    {
      puuid: KekePuuid,
      teamId: 100,
      spell1Id: 4,
      spell2Id: 3,
      championId: 50,
      profileIconId: 3496,
      riotId: "keke#6seve",
      bot: false,
    },
    {
      // Enemigo: mismo roster, otro equipo.
      puuid:
        "U9Eg85evWqkBWrcPrGyrwpKmFK77i7JgrP0rJSvx7_J8X1ZvYd05rboO-iv9tk90ekZN4aLFrj9REw",
      teamId: 200,
      championId: 17,
      riotId: "R1VA#LAS",
      bot: false,
    },
    {
      // Cuenta anonimizada: `puuid` puede venir null según la doc.
      puuid: null,
      teamId: 200,
      championId: 91,
      bot: true,
    },
  ],
};

const PUUIDS = [KekePuuid];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("toLiveGame", () => {
  it("mapea la partida real y encuentra al jugador del perfil", () => {
    const game = toLiveGame(liveGamePayload, PUUIDS);

    expect(game.gameId).toBe(1639879656);
    expect(game.queueId).toBe(420);
    expect(game.startedAt).toBe(1795594139825);
    expect(game.secondsElapsed).toBe(1246);
    expect(game.championId).toBe(50); // keke -> Swain
    expect(game.players).toHaveLength(4);
    expect(game.players[1]).toEqual({
      puuid: KekePuuid,
      championId: 50,
      teamId: 100,
      riotId: "keke#6seve",
    });
  });

  it("no se rompe con campos que Riot omite (ceros y no documentados)", () => {
    const game = toLiveGame(
      { participants: [{ puuid: "otro-puuid", championId: 103 }] },
      PUUIDS,
    );

    expect(game.queueId).toBeNull();
    expect(game.startedAt).toBeNull();
    expect(game.secondsElapsed).toBeNull();
    // El jugador del perfil no está en el roster: sin campeón, sin crash.
    expect(game.championId).toBeNull();
    expect(game.players[0]).toEqual({
      puuid: "otro-puuid",
      championId: 103,
      teamId: null,
      riotId: null,
    });
  });

  it("ignora participantes sin puuid al buscar al jugador", () => {
    const game = toLiveGame(
      {
        participants: [
          { puuid: null, championId: 1 },
          { puuid: KekePuuid, championId: 50 },
        ],
      },
      PUUIDS,
    );

    expect(game.championId).toBe(50);
  });
});

describe("getActiveGame", () => {
  beforeEach(() => {
    process.env.RIOT_API_KEY = "RGAPI-test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RIOT_API_KEY;
  });

  it("pega al host de PLATAFORMA y devuelve la partida", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(liveGamePayload));
    vi.stubGlobal("fetch", fetchSpy);

    const game = await getActiveGame(KekePuuid, "la2");

    expect(game?.gameId).toBe(1639879656);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url] = fetchSpy.mock.calls[0] as unknown as [string];
    expect(url).toBe(
      `https://la2.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${KekePuuid}`,
    );
  });

  it("404 = no está en partida, no es un error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            httpStatus: 404,
            errorCode: "NOT_FOUND",
            message: "Not Found",
            implementationDetails: "filtered",
          },
          404,
        ),
      ),
    );

    await expect(getActiveGame(KekePuuid, "la2")).resolves.toBeNull();
  });

  it("un 429 sí se propaga (lo maneja quien decide degradar)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({}), {
            status: 429,
            headers: { "content-type": "application/json", "retry-after": "0" },
          }),
      ),
    );

    await expect(getActiveGame(KekePuuid, "la2")).rejects.toMatchObject({
      status: 429,
    });
  });
});

describe("findActiveGame", () => {
  beforeEach(() => {
    process.env.RIOT_API_KEY = "RGAPI-test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RIOT_API_KEY;
  });

  it("prueba los puuids del perfil hasta encontrar la partida", async () => {
    const fetchSpy = vi.fn(async (url: string) =>
      url.includes("viejo-puuid")
        ? jsonResponse({ httpStatus: 404, errorCode: "NOT_FOUND" }, 404)
        : jsonResponse(liveGamePayload),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const found = await findActiveGame(
      ["viejo-puuid", KekePuuid],
      "la2",
    );

    expect(found?.puuid).toBe(KekePuuid);
    expect(found?.game.championId).toBe(50);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("null cuando no está jugando (todos 404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ httpStatus: 404 }, 404)),
    );

    await expect(findActiveGame([KekePuuid], "la2")).resolves.toBeNull();
  });

  it("degrada a null sin romper el perfil si Riot falla", async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(JSON.stringify({ status: { status_code: 403 } }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await expect(
      findActiveGame(["puuid-a", "puuid-b"], "la2"),
    ).resolves.toBeNull();
    // Al primer error corta: no sigue quemando cupo con el segundo puuid.
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
