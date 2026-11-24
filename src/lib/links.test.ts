import { describe, expect, it } from "vitest";
import { profileHref } from "./links";

describe("profileHref", () => {
  it("arma la URL canónica sin query", () => {
    expect(profileHref("la2", "Carlos", "RHLMC")).toBe("/perfil/la2/Carlos/RHLMC");
  });

  it("encodea los segmentos una sola vez", () => {
    expect(profileHref("kr", "Hide on bush", "KR1")).toBe(
      "/perfil/kr/Hide%20on%20bush/KR1",
    );
  });

  it("suma la página solo cuando no es la primera", () => {
    expect(profileHref("la2", "Carlos", "RHLMC", { page: 1 })).toBe(
      "/perfil/la2/Carlos/RHLMC",
    );
    expect(profileHref("la2", "Carlos", "RHLMC", { page: 3 })).toBe(
      "/perfil/la2/Carlos/RHLMC?page=3",
    );
  });

  it("combina filtros y página", () => {
    expect(
      profileHref("la2", "Carlos", "RHLMC", {
        queue: "solo",
        champion: "Ahri",
        page: 2,
      }),
    ).toBe("/perfil/la2/Carlos/RHLMC?champion=Ahri&queue=solo&page=2");
  });
});
