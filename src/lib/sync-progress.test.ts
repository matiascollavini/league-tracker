import { describe, expect, it } from "vitest";
import { decideAfterRound, formatElapsed } from "./sync-progress";

describe("formatElapsed", () => {
  it("usa segundos bajo el minuto y mm:ss arriba", () => {
    expect(formatElapsed(0)).toBe("0 s");
    expect(formatElapsed(42_000)).toBe("42 s");
    expect(formatElapsed(60_000)).toBe("1:00");
    expect(formatElapsed(754_000)).toBe("12:34");
    expect(formatElapsed(-5)).toBe("0 s");
  });
});

describe("decideAfterRound", () => {
  it("termina solo cuando Riot confirma que no hay nada nuevo", () => {
    expect(
      decideAfterRound({
        done: true,
        upToDate: true,
        stallRounds: 0,
        unverifiedRounds: 0,
      }),
    ).toEqual({ action: "settle" });
  });

  it("no termina con una vuelta que no hizo ningun request (lock/429)", () => {
    const decision = decideAfterRound({
      done: false,
      upToDate: undefined,
      stallRounds: 1,
      unverifiedRounds: 0,
    });
    expect(decision.action).toBe("continue");
  });

  it("reintenta la verificacion si la cola esta drenada pero Riot no confirmo", () => {
    expect(
      decideAfterRound({
        done: true,
        upToDate: null,
        stallRounds: 0,
        unverifiedRounds: 1,
      }),
    ).toEqual({
      action: "retry",
      notice:
        "La cola está vacía: falta que Riot confirme que no hay partidas nuevas.",
    });
  });

  it("se rinde si Riot nunca confirma despues de varios intentos", () => {
    const decision = decideAfterRound({
      done: true,
      upToDate: null,
      stallRounds: 0,
      unverifiedRounds: 3,
    });
    expect(decision.action).toBe("stop");
  });

  it("reintenta una vez si Riot confirma una partida nueva (puede ser una carrera)", () => {
    expect(
      decideAfterRound({
        done: true,
        upToDate: false,
        stallRounds: 0,
        unverifiedRounds: 0,
      }).action,
    ).toBe("retry");
    expect(
      decideAfterRound({
        done: true,
        upToDate: false,
        stallRounds: 0,
        unverifiedRounds: 2,
      }).action,
    ).toBe("stop");
  });

  it("se rinde si pasan varias vueltas sin turno de Riot", () => {
    expect(
      decideAfterRound({
        done: false,
        upToDate: null,
        stallRounds: 4,
        unverifiedRounds: 0,
      }).action,
    ).toBe("continue");
    expect(
      decideAfterRound({
        done: false,
        upToDate: null,
        stallRounds: 5,
        unverifiedRounds: 0,
      }).action,
    ).toBe("stop");
  });
});
