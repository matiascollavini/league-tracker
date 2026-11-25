import { describe, expect, it } from "vitest";
import {
  batchProgress,
  formatElapsed,
  isSettledAfterRound,
} from "./sync-progress";

describe("formatElapsed", () => {
  it("usa segundos bajo el minuto y mm:ss arriba", () => {
    expect(formatElapsed(0)).toBe("0 s");
    expect(formatElapsed(42_000)).toBe("42 s");
    expect(formatElapsed(60_000)).toBe("1:00");
    expect(formatElapsed(754_000)).toBe("12:34");
    expect(formatElapsed(-5)).toBe("0 s");
  });
});

describe("batchProgress", () => {
  it("cuenta la tanda desde cero, no desde el total de la cuenta", () => {
    // Cuenta con 1.000 partidas que ya tenía y 5 nuevas ya analizadas.
    const progress = batchProgress({
      detailed: 1_000,
      known: 1_000,
      baselineDetailed: 995,
      batchTotal: 5,
    });

    expect(progress).toEqual({ analyzed: 5, pending: 0, total: 5, pct: 100 });
  });

  it("cuenta lo que falta cuando la cuenta es nueva", () => {
    const progress = batchProgress({
      detailed: 25,
      known: 300,
      baselineDetailed: 0,
      batchTotal: 300,
    });

    expect(progress.analyzed).toBe(25);
    expect(progress.pending).toBe(275);
    expect(progress.total).toBe(300);
    expect(progress.pct).toBe(8);
  });

  it("el denominador crece si Riot devuelve más IDs a mitad de camino", () => {
    // Arrancó con 100 pendientes y el server ya conoce 500.
    const progress = batchProgress({
      detailed: 50,
      known: 500,
      baselineDetailed: 0,
      batchTotal: 100,
    });

    expect(progress.total).toBe(500);
    expect(progress.pct).toBe(10);
  });

  it("nunca pasa de 100 ni cuenta negativos", () => {
    expect(
      batchProgress({
        detailed: 120,
        known: 100,
        baselineDetailed: 20,
        batchTotal: 10,
      }),
    ).toEqual({ analyzed: 100, pending: 0, total: 100, pct: 100 });
  });

  it("sin pendientes y sin tanda no divide por cero", () => {
    expect(
      batchProgress({
        detailed: 0,
        known: 0,
        baselineDetailed: 0,
        batchTotal: 0,
      }),
    ).toEqual({ analyzed: 0, pending: 0, total: 0, pct: 0 });
  });
});

describe("isSettledAfterRound", () => {
  it("termina cuando el server dice done", () => {
    expect(isSettledAfterRound({ done: true, pending: 40, newIds: 3 })).toBe(true);
  });

  it("termina si no hay pendientes ni IDs nuevos", () => {
    expect(isSettledAfterRound({ done: false, pending: 0, newIds: 0 })).toBe(true);
  });

  it("sigue si aparecieron IDs nuevos (partidas recién jugadas)", () => {
    expect(isSettledAfterRound({ done: false, pending: 0, newIds: 1 })).toBe(false);
  });

  it("sigue mientras haya detalles pendientes", () => {
    expect(isSettledAfterRound({ done: false, pending: 12, newIds: 0 })).toBe(false);
  });
});
