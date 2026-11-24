import { describe, expect, it } from "vitest";
import { decodeParam } from "./params";

describe("decodeParam", () => {
  it("decodifica un segmento de URL", () => {
    expect(decodeParam("Hide%20on%20bush")).toBe("Hide on bush");
    expect(decodeParam("Jos%C3%A9")).toBe("José");
  });

  it("no rompe si el valor ya está decodificado", () => {
    expect(decodeParam("Hide on bush")).toBe("Hide on bush");
    expect(decodeParam("Ahri")).toBe("Ahri");
  });

  it("devuelve el original si el escape es inválido", () => {
    expect(decodeParam("100%")).toBe("100%");
    expect(decodeParam("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
