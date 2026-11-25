import { describe, expect, it } from "vitest";
import {
  CLOCK_SKEW_TOLERANCE_SECONDS,
  elapsedSeconds,
  formatGameClock,
  liveClockSeconds,
  type LiveGame,
} from "./live";

/**
 * El reloj del chip "en partida": lo que se testea acá es la aritmética que
 * corre en el navegador (sin red, sin Riot).
 */

const game: LiveGame = {
  gameId: null,
  queueId: null,
  startedAt: 1_000_000_000,
  secondsElapsed: 30,
  championId: null,
  players: [],
};

describe("elapsedSeconds (server)", () => {
  it("prefiere gameStartTime sobre gameLength (no envejece con la caché)", () => {
    expect(elapsedSeconds(game, 1_000_000_000 + 754_000)).toBe(754);
  });

  it("cae a gameLength si no vino gameStartTime", () => {
    expect(elapsedSeconds({ ...game, startedAt: null }, 9_999_999)).toBe(30);
  });

  it("null si Riot no informó ninguna de las dos cosas", () => {
    expect(
      elapsedSeconds({ ...game, startedAt: null, secondsElapsed: null }),
    ).toBeNull();
  });
});

describe("liveClockSeconds (cliente)", () => {
  const startedAt = 1_000_000_000;

  it("cuenta solo: el mismo base avanza con el reloj del navegador", () => {
    const mountedAt = startedAt + 754_000; // el server vio 12:34
    const base = 754;

    expect(
      liveClockSeconds({ startedAt, base, mountedAt, now: mountedAt }),
    ).toBe(754);
    expect(
      liveClockSeconds({
        startedAt,
        base,
        mountedAt,
        now: mountedAt + 1_000,
      }),
    ).toBe(755);
    expect(
      liveClockSeconds({
        startedAt,
        base,
        mountedAt,
        now: mountedAt + 60_000,
      }),
    ).toBe(814);
  });

  it("usa el absoluto cuando el payload llegó viejo desde la caché", () => {
    // El server renderizó con base 100, pero el HTML se sirvió 90 s después.
    const mountedAt = startedAt + 190_000;
    expect(
      liveClockSeconds({ startedAt, base: 100, mountedAt, now: mountedAt }),
    ).toBe(190);
  });

  it("si el navegador tiene la hora mal, cae al conteo relativo", () => {
    // Reloj del cliente 1 hora adelantado: el absoluto daría ~4000 s.
    const mountedAt = startedAt + 754_000 + 3_600_000;
    const absolute = Math.floor((mountedAt - startedAt) / 1_000);
    expect(absolute - 754).toBeGreaterThan(CLOCK_SKEW_TOLERANCE_SECONDS);

    expect(
      liveClockSeconds({ startedAt, base: 754, mountedAt, now: mountedAt }),
    ).toBe(754);
    expect(
      liveClockSeconds({
        startedAt,
        base: 754,
        mountedAt,
        now: mountedAt + 30_000,
      }),
    ).toBe(784);
  });

  it("sin gameStartTime usa base + tiempo desde el montaje", () => {
    const mountedAt = 5_000_000;
    expect(
      liveClockSeconds({
        startedAt: null,
        base: 42,
        mountedAt,
        now: mountedAt + 10_000,
      }),
    ).toBe(52);
  });

  it("nunca devuelve negativo", () => {
    const now = startedAt - 5_000; // el inicio está en el futuro
    expect(liveClockSeconds({ startedAt, base: 0, mountedAt: now, now })).toBe(0);
    expect(liveClockSeconds({ startedAt, base: null, mountedAt: now, now })).toBe(0);
  });

  it("null si no hay ni gameStartTime ni base", () => {
    expect(
      liveClockSeconds({
        startedAt: null,
        base: null,
        mountedAt: 1_000,
        now: 2_000,
      }),
    ).toBeNull();
  });
});

describe("formatGameClock", () => {
  it("formatea el reloj y no inventa minutos", () => {
    expect(formatGameClock(0)).toBe("0:00");
    expect(formatGameClock(754)).toBe("12:34");
    expect(formatGameClock(3_723)).toBe("62:03");
    expect(formatGameClock(null)).toBeNull();
    expect(formatGameClock(-5)).toBeNull();
    expect(formatGameClock(Number.NaN)).toBeNull();
  });
});
