import { describe, expect, it } from "vitest";
import {
  normalizeChampionName,
  searchChampions,
  type ChampionSearchRow,
} from "./champion-search";

const CATALOG = [
  "Ahri",
  "Cho'Gath",
  "Dr. Mundo",
  "Kai'Sa",
  "Karma",
  "Nunu y Willump",
  "Zoe",
];

const row = (championName: string, name: string): ChampionSearchRow => ({
  championName,
  name,
});

const PLAYED = [
  row("Kaisa", "Kai'Sa"),
  row("Nunu", "Nunu y Willump"),
  row("Chogath", "Cho'Gath"),
];

describe("normalizeChampionName", () => {
  it("ignora mayúsculas, apóstrofes, puntos y acentos", () => {
    expect(normalizeChampionName("Kai'Sa")).toBe("kaisa");
    expect(normalizeChampionName("Cho'Gath")).toBe("chogath");
    expect(normalizeChampionName("Dr. Mundo")).toBe("drmundo");
    expect(normalizeChampionName("  NUNU y Willump ")).toBe("nunuywillump");
  });
});

describe("searchChampions", () => {
  it("no filtra nada con la búsqueda vacía o en blanco", () => {
    expect(searchChampions(PLAYED, CATALOG, "")).toEqual({
      matches: [],
      notPlayed: [],
    });
    expect(searchChampions(PLAYED, CATALOG, "   ")).toEqual({
      matches: [],
      notPlayed: [],
    });
  });

  it("encuentra por nombre visible, ignorando apóstrofes", () => {
    const result = searchChampions(PLAYED, CATALOG, "kaisa");
    expect(result.matches.map((m) => m.championName)).toEqual(["Kaisa"]);
    expect(result.notPlayed).toEqual([]);
  });

  it("encuentra por id de Riot cuando el nombre visible no coincide", () => {
    const result = searchChampions(PLAYED, CATALOG, "nunu");
    expect(result.matches.map((m) => m.championName)).toEqual(["Nunu"]);
  });

  it("coincide en el medio del nombre y con varias filas", () => {
    const result = searchChampions(PLAYED, CATALOG, "a");
    expect(result.matches.map((m) => m.championName)).toEqual([
      "Kaisa",
      "Chogath",
    ]);
  });

  it("distingue un campeón no jugado de un nombre inexistente", () => {
    expect(searchChampions(PLAYED, CATALOG, "karma")).toEqual({
      matches: [],
      notPlayed: ["Karma"],
    });
    expect(searchChampions(PLAYED, CATALOG, "zzz")).toEqual({
      matches: [],
      notPlayed: [],
    });
  });

  it("respeta tildes del catálogo al buscar sin tildes", () => {
    const result = searchChampions([], ["Kai'Sa"], "kai'sa");
    expect(result.notPlayed).toEqual(["Kai'Sa"]);
  });
});
