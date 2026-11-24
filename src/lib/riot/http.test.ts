import { describe, expect, it } from "vitest";
import { clusterFor } from "./config";
import { riotHost } from "./http";

describe("riotHost", () => {
  it("usa el host de PLATAFORMA para summoner, league y mastery", () => {
    expect(riotHost({ platform: "kr" })).toBe("kr.api.riotgames.com");
    expect(riotHost({ platform: "la2" })).toBe("la2.api.riotgames.com");
    expect(riotHost({ platform: "euw1" })).toBe("euw1.api.riotgames.com");
  });

  it("usa el host REGIONAL para account y match", () => {
    expect(riotHost({ cluster: clusterFor("kr") })).toBe("asia.api.riotgames.com");
    expect(riotHost({ cluster: clusterFor("la2") })).toBe("americas.api.riotgames.com");
    expect(riotHost({ cluster: clusterFor("euw1") })).toBe("europe.api.riotgames.com");
    expect(riotHost({ cluster: clusterFor("oc1") })).toBe("sea.api.riotgames.com");
  });

  it("KR: plataforma y cluster son distintos (el error clásico)", () => {
    expect(riotHost({ platform: "kr" })).not.toBe(riotHost({ cluster: clusterFor("kr") }));
  });
});
