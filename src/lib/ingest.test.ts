import { existsSync, rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Base de test aparte: sin tocar data/league.db.
const TEST_DB = "./data/vitest-ingest.db";
process.env.DATABASE_URL = `file:${TEST_DB}`;

// Riot nunca se toca en estos tests: la red se reemplaza por los mocks.
vi.mock("@/lib/riot/matches", () => ({
  historyWindowStart: () => 0,
  getMatchIdsPage: vi.fn(),
  getMatch: vi.fn(),
}));

import { RiotApiError, RiotDeadlineError } from "@/lib/riot/http";
import { getMatch, getMatchIdsPage } from "@/lib/riot/matches";
import type { Match, Participant } from "@/lib/riot/types";
import { closeDb, ensureSchema } from "./db/client";
import {
  getProgress,
  getSyncState,
  pendingMatchIds,
  resetDbForTests,
  tryLockSync,
} from "./db/matches";
import { syncPuuid } from "./ingest";

const PUUID_DEADLINE = "d".repeat(78);
const PUUID_404 = "u".repeat(78);
const PUUID_LOCK = "l".repeat(78);
const PUUID_COMPLETE = "c".repeat(78);
const PUUID_THROTTLE = "t".repeat(78);
const PUUID_DESMENTIDO = "z".repeat(78);

const participant = (puuid: string): Participant => ({
  puuid,
  championId: 103,
  championName: "Ahri",
  teamId: 100,
  teamPosition: "MIDDLE",
  win: true,
  kills: 5,
  deaths: 2,
  assists: 7,
  goldEarned: 10_000,
  totalMinionsKilled: 150,
  visionScore: 20,
  totalDamageDealtToChampions: 20_000,
});

function makeMatch(matchId: string, puuid: string): Match {
  return {
    metadata: { matchId, participants: [puuid] },
    info: {
      gameCreation: 1_700_000_000_000,
      gameStartTimestamp: 1_700_000_000_000,
      gameEndTimestamp: 1_700_001_800_000,
      gameDuration: 1_800,
      gameMode: "CLASSIC",
      gameVersion: "16.23.1",
      queueId: 420,
      participants: [participant(puuid)],
    },
  };
}

beforeAll(async () => {
  if (existsSync(TEST_DB)) rmSync(TEST_DB, { force: true });
  await ensureSchema();
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

beforeEach(async () => {
  await resetDbForTests();
  vi.clearAllMocks();
});

describe("syncPuuid — corrida acotada por tiempo", () => {
  it("con deadline corta la vuelta sin romper y sin dejar el lock tomado", async () => {
    vi.mocked(getMatchIdsPage).mockResolvedValue(["M2", "M1"]);
    // Se acabó el tiempo justo cuando iba a bajar la primera partida.
    vi.mocked(getMatch).mockRejectedValueOnce(
      new RiotDeadlineError("/lol/match/v5/matches/M2"),
    );

    const result = await syncPuuid(PUUID_DEADLINE, "la2", {
      budget: 10,
      maxPages: 1,
      deadlineMs: 5_000,
    });

    // No explota: devuelve lo hecho y queda reanudable.
    expect(result.skipped).toBe(false);
    expect(result.done).toBe(false);
    expect(result.phase).toBe("details");
    expect(result.unavailable).toBe(0);
    expect(result.requests).toBe(1); // solo la página de IDs
    expect(result.progress).toEqual({ known: 2, detailed: 0 });
    expect(await pendingMatchIds(PUUID_DEADLINE, 10)).toEqual(["M2", "M1"]);

    // Sin el arreglo, el lock de 600 s quedaba huérfano y trababa la cuenta.
    const state = await getSyncState(PUUID_DEADLINE);
    expect(state?.lockedUntil).toBeNull();
    // El cursor de IDs se guardó igual (página corta = fin del historial).
    expect(state?.backfillState).toBe("done");
  });
});

describe("syncPuuid — corte por rate limit", () => {
  it("si el bucket niega la primera página, informa cuánto esperar (no es un lock)", async () => {
    // Reproduce lo que pasa con el bucket saturado: el Riot ID se resolvió,
    // pero la página de IDs ya no tiene turno.
    vi.mocked(getMatchIdsPage).mockRejectedValue(
      new RiotDeadlineError("/lol/match/v5/matches/by-puuid/x/ids", 63_000),
    );

    const result = await syncPuuid(PUUID_THROTTLE, "la2", {
      budget: 30,
      maxPages: 3,
      deadlineMs: 40_000,
    });

    // Ni error ni lock: cero requests y un "esperá esto" explícito. El route lo
    // publica como phase "throttled" y el loader no lo confunde con un lock.
    expect(result.skipped).toBe(false);
    expect(result.done).toBe(false);
    expect(result.phase).toBe("ids");
    expect(result.requests).toBe(0);
    expect(result.retryAfterMs).toBe(63_000);
    expect((await getSyncState(PUUID_THROTTLE))?.lockedUntil).toBeNull();
  });
});

describe("syncPuuid — partidas que Riot ya no tiene", () => {
  it("descarta la 404 y sigue con la siguiente, sin trabar la cola", async () => {
    vi.mocked(getMatchIdsPage).mockResolvedValue(["M9", "M8"]);
    vi.mocked(getMatch).mockImplementation(async (matchId: string) => {
      if (matchId === "M9") {
        throw new RiotApiError(404, "Not found", matchId);
      }
      return makeMatch(matchId, PUUID_404);
    });

    const result = await syncPuuid(PUUID_404, "la2", {
      budget: 10,
      maxPages: 1,
      deadlineMs: 5_000,
    });

    expect(result.unavailable).toBe(1);
    expect(result.progress).toEqual({ known: 1, detailed: 1 });
    expect(result.done).toBe(true);
    // La 404 no vuelve a aparecer como pendiente: si no, sería siempre la
    // primera de la cola y ninguna corrida avanzaría.
    expect(await pendingMatchIds(PUUID_404, 10)).toEqual([]);
  });

  it("un 5xx no descarta la partida: se reintenta en la próxima vuelta", async () => {
    vi.mocked(getMatchIdsPage).mockResolvedValue(["M5"]);
    vi.mocked(getMatch).mockRejectedValue(
      new RiotApiError(503, "Service unavailable", "M5"),
    );

    await expect(
      syncPuuid(PUUID_404, "la2", { budget: 10, maxPages: 1, deadlineMs: 5_000 }),
    ).rejects.toThrow(/Service unavailable/);

    expect(await pendingMatchIds(PUUID_404, 10)).toEqual(["M5"]);
    const state = await getSyncState(PUUID_404);
    expect(state?.lockedUntil).toBeNull();
  });
});

describe("syncPuuid — cuentas ya completas", () => {
  it("no vuelve a 'partial' ni pierde el done en cada vuelta", async () => {
    // 1) Primera lectura: Riot no devuelve nada => historial completo.
    vi.mocked(getMatchIdsPage).mockResolvedValueOnce([]);
    const first = await syncPuuid(PUUID_COMPLETE, "la2", { budget: 10 });
    expect(first.done).toBe(true);
    expect((await getSyncState(PUUID_COMPLETE))?.backfillState).toBe("done");

    // 2) Después de 'done' solo se mira la página 0, que viene llena: antes eso
    //    pisaba el estado con 'partial' y la cuenta volvía a la cola del worker.
    const ids = Array.from({ length: 100 }, (_, i) => `C${String(i).padStart(3, "0")}`);
    vi.mocked(getMatchIdsPage).mockResolvedValue(ids);
    vi.mocked(getMatch).mockImplementation(async (matchId: string) =>
      makeMatch(matchId, PUUID_COMPLETE),
    );

    const second = await syncPuuid(PUUID_COMPLETE, "la2", { budget: 3 });
    expect(second.done).toBe(false); // faltan detalles: es correcto
    expect((await getSyncState(PUUID_COMPLETE))?.backfillState).toBe("done");

    // 3) Cuando se bajan los detalles, vuelve a cerrar en done.
    const third = await syncPuuid(PUUID_COMPLETE, "la2", { budget: 200 });
    expect(third.progress).toEqual({ known: 100, detailed: 100 });
    expect(third.done).toBe(true);
    expect(third.phase).toBe("done");
  });
});

describe("syncPuuid — links que Riot desmiente", () => {
  it("si el payload no lista al jugador, descarta el link y el progreso cierra", async () => {
    vi.mocked(getMatchIdsPage).mockResolvedValue(["Z1"]);
    // Riot devuelve la partida, pero el jugador no está adentro.
    vi.mocked(getMatch).mockResolvedValue(makeMatch("Z1", "o".repeat(78)));

    const result = await syncPuuid(PUUID_DESMENTIDO, "la2", {
      budget: 10,
      maxPages: 1,
      deadlineMs: 5_000,
    });

    expect(result.unavailable).toBe(1);
    expect(result.progress).toEqual({ known: 0, detailed: 0 });
    expect(result.done).toBe(true);
    expect(await pendingMatchIds(PUUID_DESMENTIDO, 10)).toEqual([]);
  });
});

describe("syncPuuid — lock cooperativo", () => {
  it("si el lock lo tiene otro proceso, no gasta requests y avisa cuánto falta", async () => {
    await ensureSchema();
    expect(await tryLockSync(PUUID_LOCK, "la2", 60)).not.toBeNull();

    const result = await syncPuuid(PUUID_LOCK, "la2", {
      budget: 10,
      maxPages: 1,
      deadlineMs: 5_000,
    });

    expect(result.skipped).toBe(true);
    expect(result.phase).toBe("locked");
    expect(result.requests).toBe(0);
    expect(result.lockForMs).toBeGreaterThan(0);
    expect(getMatchIdsPage).not.toHaveBeenCalled();
    expect(getMatch).not.toHaveBeenCalled();
  });

  it("al terminar, el lock queda libre aunque la corrida haya tenido éxito", async () => {
    vi.mocked(getMatchIdsPage).mockResolvedValue([]);

    const result = await syncPuuid(PUUID_LOCK, "la2", {
      budget: 10,
      maxPages: 1,
      deadlineMs: 5_000,
    });

    expect(result.phase).toBe("done");
    expect(await getProgress(PUUID_LOCK)).toEqual({ known: 0, detailed: 0 });
    const state = await getSyncState(PUUID_LOCK);
    expect(state?.lockedUntil).toBeNull();
  });
});
