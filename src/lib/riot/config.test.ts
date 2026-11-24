import { describe, expect, it } from "vitest";
import {
  clusterFor,
  isPlatform,
  isQueueFilter,
  PLATFORMS,
  queuesFor,
  queueLabel,
} from "./config";

describe("routing", () => {
  it("mapea cada plataforma a un cluster válido", () => {
    for (const platform of PLATFORMS) {
      expect(["americas", "asia", "europe", "sea"]).toContain(
        clusterFor(platform),
      );
    }
  });

  it("mapea los casos que más se equivocan", () => {
    expect(clusterFor("la1")).toBe("americas");
    expect(clusterFor("la2")).toBe("americas");
    expect(clusterFor("br1")).toBe("americas");
    expect(clusterFor("kr")).toBe("asia");
    expect(clusterFor("jp1")).toBe("asia");
    expect(clusterFor("euw1")).toBe("europe");
    expect(clusterFor("me1")).toBe("europe");
    expect(clusterFor("oc1")).toBe("sea");
  });

  it("valida plataformas", () => {
    expect(isPlatform("la2")).toBe(true);
    expect(isPlatform("LAS")).toBe(false);
    expect(isPlatform("las")).toBe(false);
    expect(isPlatform("")).toBe(false);
  });
});

describe("filtros de cola", () => {
  it("valida ids de filtro", () => {
    expect(isQueueFilter("solo")).toBe(true);
    expect(isQueueFilter("all")).toBe(true);
    expect(isQueueFilter("dominion")).toBe(false);
    expect(isQueueFilter(undefined)).toBe(false);
  });

  it("devuelve las colas de cada filtro", () => {
    expect(queuesFor("solo")).toEqual([420]);
    expect(queuesFor("flex")).toEqual([440]);
    expect(queuesFor("normal")).toContain(400);
    expect(queuesFor("aram")).toContain(450);
    expect(queuesFor("all")).toEqual([]);
  });

  it("etiqueta colas conocidas y desconocidas", () => {
    expect(queueLabel(420)).toBe("Solo/Duo");
    expect(queueLabel(450)).toBe("ARAM");
    expect(queueLabel(31337)).toBe("Cola 31337");
  });
});
