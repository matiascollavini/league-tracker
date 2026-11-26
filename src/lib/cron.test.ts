import { describe, expect, it } from "vitest";
import {
  checkSecret,
  cronBudget,
  cronDeadlineMs,
  cronPlayerSlice,
  cronPlayers,
  presentedSecret,
} from "./cron";

const withAuth = (headers: Record<string, string>) =>
  new Request("https://league.test/api/cron", { headers });

describe("presentedSecret", () => {
  it("lee el Bearer del header", () => {
    expect(presentedSecret(withAuth({ authorization: "Bearer s3crET" }))).toBe(
      "s3crET",
    );
  });

  it("acepta el token pelado (algunos servicios no mandan Bearer)", () => {
    expect(presentedSecret(withAuth({ authorization: "s3crET" }))).toBe("s3crET");
  });

  it("acepta ?key= para los cron que no mandan headers", () => {
    const request = new Request("https://league.test/api/cron?key=abc123");
    expect(presentedSecret(request)).toBe("abc123");
  });

  it("sin nada devuelve null", () => {
    expect(presentedSecret(new Request("https://league.test/api/cron"))).toBe(
      null,
    );
  });
});

describe("checkSecret", () => {
  it("sin secreto configurado en el servidor responde 'missing'", () => {
    expect(checkSecret("loQueSea", undefined)).toBe("missing");
    expect(checkSecret("loQueSea", "   ")).toBe("missing");
  });

  it("sin secreto presentado no autoriza", () => {
    expect(checkSecret(null, "abc")).toBe("unauthorized");
  });

  it("autoriza solo con el secreto exacto", () => {
    expect(checkSecret("abc", "abc")).toBe("ok");
    expect(checkSecret("abd", "abc")).toBe("unauthorized");
    expect(checkSecret("abc ", "abc")).toBe("unauthorized");
  });
});

describe("presupuestos del cron", () => {
  it("usa defaults conservadores", () => {
    expect(cronBudget({})).toBe(40);
    expect(cronDeadlineMs({})).toBe(45_000);
    expect(cronPlayers({})).toBe(3);
  });

  it("respeta el techo de 60 s de la función y los límites de la cola", () => {
    expect(cronDeadlineMs({ CRON_DEADLINE_MS: "999999" })).toBe(55_000);
    expect(cronBudget({ CRON_BUDGET: "99999" })).toBe(300);
    expect(cronPlayers({ CRON_PLAYERS: "99" })).toBe(5);
    expect(cronPlayers({ CRON_PLAYERS: "0" })).toBe(1);
  });

  it("ignora valores basura", () => {
    expect(cronBudget({ CRON_BUDGET: "no" })).toBe(40);
    expect(cronDeadlineMs({ CRON_DEADLINE_MS: "" })).toBe(45_000);
  });

  it("el slice por jugador nunca pasa el presupuesto restante", () => {
    expect(cronPlayerSlice(8)).toBe(8);
    expect(cronPlayerSlice(500)).toBe(120);
    expect(cronPlayerSlice(0)).toBe(1);
  });
});
