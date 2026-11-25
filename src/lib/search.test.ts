import { describe, expect, it } from "vitest";
import { MIN_QUERY_LENGTH, parseRiotId, SearchResponseSchema } from "./search";

describe("parseRiotId", () => {
  it("acepta un Riot ID completo", () => {
    expect(parseRiotId("Faker#KR1")).toEqual({
      ok: true,
      value: { gameName: "Faker", tagLine: "KR1" },
    });
  });

  it("recorta espacios y corta por el último #", () => {
    expect(parseRiotId("  The Faker #KR1 ")).toEqual({
      ok: true,
      value: { gameName: "The Faker", tagLine: "KR1" },
    });
  });

  it("rechaza lo que no tiene tag", () => {
    const result = parseRiotId("Faker");
    expect(result.ok).toBe(false);
  });

  it("rechaza un tag vacío", () => {
    expect(parseRiotId("Faker#").ok).toBe(false);
  });

  it("rechaza partes demasiado cortas", () => {
    expect(parseRiotId("Fa#KR1").ok).toBe(false);
    expect(parseRiotId("Faker#K").ok).toBe(false);
  });

  it("el mínimo de búsqueda es menor que el largo mínimo del nombre", () => {
    expect(MIN_QUERY_LENGTH).toBeLessThanOrEqual(3);
  });
});

describe("SearchResponseSchema", () => {
  it("valida la forma que devuelve /api/buscar", () => {
    const parsed = SearchResponseSchema.safeParse({
      query: "fak",
      results: [
        {
          gameName: "Faker",
          tagLine: "KR1",
          platform: "kr",
          iconUrl: null,
          level: 312,
          href: "/perfil/kr/Faker/KR1",
        },
      ],
      indexed: 1234,
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza plataformas que no son de Riot", () => {
    const parsed = SearchResponseSchema.safeParse({
      query: "fak",
      results: [
        {
          gameName: "Faker",
          tagLine: "KR1",
          platform: "xx9",
          iconUrl: null,
          level: null,
          href: "/perfil/xx9/Faker/KR1",
        },
      ],
      indexed: 1,
    });
    expect(parsed.success).toBe(false);
  });
});
