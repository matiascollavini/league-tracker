import { describe, expect, it } from "vitest";
import { participantHref, profileHref } from "./links";

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

  it("suma el filtro de rol, incluso el 'sin rol'", () => {
    expect(profileHref("la2", "Carlos", "RHLMC", { role: "JUNGLE" })).toBe(
      "/perfil/la2/Carlos/RHLMC?role=JUNGLE",
    );
    expect(profileHref("la2", "Carlos", "RHLMC", { role: "none" })).toBe(
      "/perfil/la2/Carlos/RHLMC?role=none",
    );
  });

  it("combina rol, campeón y cola", () => {
    expect(
      profileHref("la2", "Carlos", "RHLMC", {
        queue: "solo",
        champion: "Ahri",
        role: "MIDDLE",
        page: 3,
      }),
    ).toBe(
      "/perfil/la2/Carlos/RHLMC?champion=Ahri&queue=solo&role=MIDDLE&page=3",
    );
  });
});

describe("participantHref", () => {
  it("arma el perfil del participante con la plataforma de la partida", () => {
    expect(participantHref("la2", "Carlos#RHLMC")).toBe(
      "/perfil/la2/Carlos/RHLMC",
    );
    expect(participantHref("kr", "Hide on bush#KR1")).toBe(
      "/perfil/kr/Hide%20on%20bush/KR1",
    );
  });

  it("corta por el último # (el nombre puede tener símbolos)", () => {
    expect(participantHref("na1", "a#b#NA1")).toBe("/perfil/na1/a%23b/NA1");
  });

  it("devuelve null cuando no hay link posible", () => {
    expect(participantHref("la2", null)).toBeNull();
    expect(participantHref(null, "Carlos#RHLMC")).toBeNull();
    expect(participantHref("LAS", "Carlos#RHLMC")).toBeNull();
    expect(participantHref("la2", "Carlos")).toBeNull();
    expect(participantHref("la2", "Carlos#")).toBeNull();
    expect(participantHref("la2", "#RHLMC")).toBeNull();
  });
});
