import { describe, expect, it } from "vitest";
import {
  absoluteLp,
  APEX_BASE_LP,
  buildRankSeries,
  extendRankHistory,
  fromAbsoluteLp,
  ladderLabel,
  lpDomain,
  rankLabel,
  type RankHistoryEntry,
  type RankPoint,
} from "./rank-history";

describe("absoluteLp", () => {
  it("mapea la escalera con divisiones: 400 LP por tier", () => {
    expect(absoluteLp("IRON", "IV", 0)).toBe(0);
    expect(absoluteLp("IRON", "I", 99)).toBe(399);
    expect(absoluteLp("BRONZE", "IV", 0)).toBe(400);
    expect(absoluteLp("PLATINUM", "II", 64)).toBe(1864);
    expect(absoluteLp("DIAMOND", "I", 99)).toBe(APEX_BASE_LP - 1);
  });

  it("apila Maestro+ arriba de Diamante I", () => {
    expect(absoluteLp("MASTER", null, 0)).toBe(APEX_BASE_LP);
    expect(absoluteLp("GRANDMASTER", null, 500)).toBe(APEX_BASE_LP + 500);
    expect(absoluteLp("CHALLENGER", null, 900)).toBe(APEX_BASE_LP + 900);
  });

  it("ignora mayúsculas y no inventa tiers desconocidos", () => {
    expect(absoluteLp("platinum", "ii", 64)).toBe(1864);
    expect(absoluteLp("UNRANKED", "I", 10)).toBeNull();
    expect(absoluteLp("", "I", 10)).toBeNull();
  });
});

describe("fromAbsoluteLp", () => {
  it("vuelve al tier, división y LP", () => {
    expect(fromAbsoluteLp(1864)).toMatchObject({
      tier: "PLATINUM",
      division: "II",
      leaguePoints: 64,
    });
    expect(fromAbsoluteLp(APEX_BASE_LP + 320)).toMatchObject({
      tier: "MASTER",
      division: null,
      leaguePoints: 320,
    });
  });

  it("no baja de Hierro IV", () => {
    expect(fromAbsoluteLp(-50)).toMatchObject({
      tier: "IRON",
      division: "IV",
      leaguePoints: 0,
    });
  });
});

describe("etiquetas", () => {
  it("rankLabel usa el tier guardado (distingue Gran Maestro)", () => {
    expect(
      rankLabel({
        ts: 1,
        tier: "GRANDMASTER",
        division: null,
        leaguePoints: 512,
      }),
    ).toBe("Gran Maestro 512 LP");
    expect(
      rankLabel({ ts: 1, tier: "PLATINUM", division: "ii", leaguePoints: 64 }),
    ).toBe("Platino II 64 LP");
  });

  it("ladderLabel nombra la división del LP absoluto", () => {
    expect(ladderLabel(1600)).toBe("Platino IV");
    expect(ladderLabel(1864)).toBe("Platino II");
    expect(ladderLabel(2799)).toBe("Diamante I");
    expect(ladderLabel(APEX_BASE_LP + 250)).toBe("250 LP");
  });
});

describe("buildRankSeries", () => {
  it("ordena, normaliza y descarta lo que no se puede graficar", () => {
    const points = buildRankSeries([
      { ts: 3_000, tier: "PLATINUM", division: "II", leaguePoints: 64 },
      { ts: 1_000, tier: "PLATINUM", division: "IV", leaguePoints: 20 },
      { ts: 2_000, tier: "UNRANKED", division: null, leaguePoints: 0 },
    ]);
    expect(points.map((point) => point.ts)).toEqual([1_000, 3_000]);
    expect(points.map((point) => point.lp)).toEqual([1620, 1864]);
    expect(points[1]?.label).toBe("Platino II 64 LP");
  });

  it("si dos fotos caen en el mismo ms, gana la última", () => {
    const points = buildRankSeries([
      { ts: 1_000, tier: "GOLD", division: "IV", leaguePoints: 20 },
      { ts: 1_000, tier: "GOLD", division: "IV", leaguePoints: 45 },
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]?.lp).toBe(1245);
  });
});

describe("lpDomain", () => {
  const point = (ts: number, lp: number): RankPoint => {
    const rank = fromAbsoluteLp(lp);
    return { ...rank, ts, lp, label: rankLabel(rank) };
  };

  it("encierra todos los puntos en múltiplos del paso", () => {
    const domain = lpDomain([point(1, 1620), point(2, 1708), point(3, 1650)]);
    expect(domain.lo).toBeLessThanOrEqual(1620);
    expect(domain.hi).toBeGreaterThanOrEqual(1708);
    expect(domain.lo % domain.step).toBe(0);
    expect(domain.hi % domain.step).toBe(0);
    for (const tick of domain.ticks) {
      expect(tick).toBeGreaterThan(domain.lo);
      expect(tick).toBeLessThan(domain.hi);
      expect(tick % domain.step).toBe(0);
    }
  });

  it("no deja el eje en cero cuando el rango no se mueve", () => {
    const domain = lpDomain([point(1, 1245), point(2, 1245)]);
    expect(domain.hi - domain.lo).toBeGreaterThanOrEqual(100);
    expect(domain.ticks.length).toBeGreaterThan(0);
  });

  it("nunca muestra LP negativos", () => {
    const domain = lpDomain([point(1, 5), point(2, 35)]);
    expect(domain.lo).toBe(0);
  });
});

describe("extendRankHistory", () => {
  const row = (
    queueType: string,
    ts: number,
    leaguePoints: number,
  ): RankHistoryEntry => ({
    queueType,
    ts,
    tier: "GOLD",
    division: "IV",
    leaguePoints,
  });
  const NOW = 10_000_000;

  it("lleva el último valor de cada cola hasta hoy", () => {
    const rows = [
      row("RANKED_SOLO_5x5", NOW - 5 * 60_000, 10),
      row("RANKED_SOLO_5x5", NOW - 4 * 60_000, 40),
      row("RANKED_FLEX_SR", NOW - 3 * 60_000, 70),
      row("RANKED_FLEX_SR", NOW - 2 * 60_000, 90),
    ];
    const extended = extendRankHistory(rows, NOW);
    const solo = extended.filter((r) => r.queueType === "RANKED_SOLO_5x5");
    const flex = extended.filter((r) => r.queueType === "RANKED_FLEX_SR");
    expect(solo).toHaveLength(3);
    expect(solo[2]?.ts).toBe(NOW);
    expect(solo[2]?.leaguePoints).toBe(40);
    expect(flex[2]?.leaguePoints).toBe(90);
  });

  it("no inventa una línea con una sola medición", () => {
    expect(extendRankHistory([row("RANKED_SOLO_5x5", NOW - 5 * 60_000, 10)], NOW)).toHaveLength(1);
  });

  it("no extiende si el rango es una foto vieja", () => {
    const rows = [
      row("RANKED_SOLO_5x5", NOW - 5 * 60_000, 10),
      row("RANKED_SOLO_5x5", NOW - 4 * 60_000, 40),
    ];
    expect(extendRankHistory(rows, NOW, { stale: true })).toHaveLength(2);
  });

  it("no duplica el punto si la última medición es de ahora", () => {
    const rows = [
      row("RANKED_SOLO_5x5", NOW - 5 * 60_000, 10),
      row("RANKED_SOLO_5x5", NOW, 40),
    ];
    expect(extendRankHistory(rows, NOW)).toHaveLength(2);
  });
});
