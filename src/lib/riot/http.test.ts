import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
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

describe("riotFetch — presupuesto de tiempo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.RIOT_RATE_LIMIT_PER_2MIN;
    delete process.env.RIOT_RATE_LIMIT_PER_SECOND;
    delete process.env.RIOT_API_KEY;
  });

  it("no espera 2 minutos por el rate limit si el turno no entra en el deadline", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify("ok"), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    process.env.RIOT_API_KEY = "RGAPI-test";
    // Bucket de un solo turno: el segundo request tendría que esperar 2 minutos.
    process.env.RIOT_RATE_LIMIT_PER_2MIN = "1";
    process.env.RIOT_RATE_LIMIT_PER_SECOND = "1";
    vi.resetModules();
    const { riotFetch, RiotDeadlineError } = await import("./http");

    const options = { platform: "la2" as const, revalidate: 0, schema: z.string() };
    await expect(riotFetch("/lol/match/v5/matches/TEST", options)).resolves.toBe("ok");

    const started = Date.now();
    await expect(
      riotFetch("/lol/match/v5/matches/TEST", { ...options, deadline: started + 500 }),
    ).rejects.toBeInstanceOf(RiotDeadlineError);

    // Cortó en milisegundos (no durmió los 2 minutos) y sin gastar un request.
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
