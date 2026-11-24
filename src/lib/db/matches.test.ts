import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Base de test aparte: un archivo temporal, sin tocar data/league.db.
const TEST_DB = "./data/vitest.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;

import { closeDb, ensureSchema } from "./client";
import {
  filterKnownMatchIds,
  getAliasPuuids,
  getPlayerLabel,
  getPlayerMatchesWithProgress,
  touchSyncState,
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

  it("junta los datos de los dos puuids del mismo jugador (Riot los reasigna)", async () => {
    const VIEJO = "v".repeat(78);
    const NUEVO = "n".repeat(78);
    const OTRO = "o".repeat(78);
    // Nombre compartido en puuid_sync: son la misma persona.
    await touchSyncState(VIEJO, "la2", { gameName: "keke", tagLine: "6seve" });
    await touchSyncState(NUEVO, "la2", { gameName: "keke", tagLine: "6seve" });

    // m1: partida guardada con el puuid VIEJO.
    const conViejo: Match = {
      ...makeMatch({ matchId: "m1" }),
      info: {
        ...makeMatch({ matchId: "m1" }).info,
        participants: [
          { puuid: VIEJO, championId: 103, championName: "Ahri", win: true },
        ],
      },
    };
    await saveMatch(conViejo, "la2");

    // m2: Riot la devuelve para el puuid VIEJO, pero el payload lista al jugador
    // con el puuid NUEVO (esto es literalmente lo que pasa con keke).
    const conNuevo: Match = {
      ...makeMatch({ matchId: "m2" }),
      info: {
        ...makeMatch({ matchId: "m2" }).info,
        participants: [
          { puuid: NUEVO, championId: 103, championName: "Ahri", win: true },
          { puuid: OTRO, championId: 222, championName: "Jinx", win: false },
        ],
      },
    };
    await saveMatch(conNuevo, "la2");
    await registerMatchIds(VIEJO, ["m2"]);
    await registerMatchIds(NUEVO, ["m2"]);

    // Visto por separado, el puuid viejo "pierde" m2: de ahí el 714 de 756.
    expect(await getProgress(VIEJO)).toEqual({ known: 2, detailed: 1 });

    // Juntos, el progreso cierra y la partida se ve una sola vez.
    const both = await getPlayerMatchesWithProgress([VIEJO, NUEVO]);
    expect(both.progress).toEqual({ known: 2, detailed: 2 });
    expect(both.matches.map((m) => m.metadata.matchId).sort()).toEqual(["m1", "m2"]);
    expect(await getAliasPuuids(VIEJO)).toEqual(
      expect.arrayContaining([VIEJO, NUEVO]),
    );
    expect(await pendingMatchIds([VIEJO, NUEVO], 10)).toEqual([]);
  });

  it("avisa si el jugador está en la cola (participante de partidas ajenas = no)", async () => {
    const AJENO = "a".repeat(78);
    const AUTH = "b".repeat(78);
    // Una partida bajada para OTRO jugador vincula a los 10 participantes.
    const shared: Match = {
      ...makeMatch({ matchId: "s1" }),
      metadata: { matchId: "s1", participants: [AUTH, AJENO] },
      info: {
        ...makeMatch({ matchId: "s1" }).info,
        participants: [
          { puuid: AUTH, championId: 1, championName: "Ahri", win: true },
          { puuid: AJENO, championId: 2, championName: "Jinx", win: false },
        ],
      },
    };
    await saveMatch(shared, "la2");

    // Tiene partidas pero nunca estuvo en la cola: el perfil tiene que
    // sincronizarlo, si no queda congelado en "1 de 1" para siempre.
    const before = await getPlayerMatchesWithProgress(AJENO);
    expect(before.matches).toHaveLength(1);
    expect(before.queued).toBe(false);

    await touchSyncState(AJENO, "la2", { backfillState: "none" });
    const after = await getPlayerMatchesWithProgress(AJENO);
    expect(after.queued).toBe(true);
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

describe("link de vuelta al perfil", () => {
  const ALIAS = "a".repeat(78);

  function conParticipante(
    matchId: string,
    puuid: string,
    riotIdGameName: string,
    riotIdTagline: string,
  ): Match {
    const match = makeMatch({ matchId });
    match.metadata.participants = [puuid];
    match.info.participants = [
      {
        ...match.info.participants[0]!,
        puuid,
        riotIdGameName,
        riotIdTagline,
      },
    ];
    return match;
  }

  it("usa el Riot ID del perfil guardado", async () => {
    await touchSyncState(PUUID, "la2", {
      gameName: "Carlos",
      tagLine: "RHLMC",
    });

    expect(await getPlayerLabel(PUUID)).toEqual({
      gameName: "Carlos",
      tagLine: "RHLMC",
      platform: "la2",
    });
  });

  it("resuelve un alias por el Riot ID que Riot guardó en sus partidas", async () => {
    await touchSyncState(PUUID, "la2", {
      gameName: "Carlos",
      tagLine: "RHLMC",
    });
    await saveMatch(
      conParticipante("LA2_alias", ALIAS, "Carlos", "RHLMC"),
      "la2",
    );

    // El alias no tiene perfil guardado, pero sí un Riot ID que lo delata.
    expect(await getPlayerLabel(ALIAS)).toEqual({
      gameName: "Carlos",
      tagLine: "RHLMC",
      platform: "la2",
    });
  });

  it("cae al Riot ID de la partida si el perfil no está guardado", async () => {
    await saveMatch(
      conParticipante("LA1_suelto", ALIAS, "Otro", "LAS"),
      "la1",
    );

    expect(await getPlayerLabel(ALIAS)).toEqual({
      gameName: "Otro",
      tagLine: "LAS",
      platform: "la1",
    });
  });

  it("devuelve null si no hay perfil ni partidas", async () => {
    expect(await getPlayerLabel(ALIAS)).toBeNull();
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
