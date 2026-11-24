import { describe, expect, it } from "vitest";
import { championIconUrl } from "./champions";

describe("championIconUrl", () => {
  it("usa el nombre de campeón tal cual cuando coincide con Data Dragon", () => {
    expect(championIconUrl("16.23.1", "LeeSin")).toBe(
      "https://ddragon.leagueoflegends.com/cdn/16.23.1/img/champion/LeeSin.png",
    );
  });

  it("traduce el id del cliente al archivo real de Data Dragon", () => {
    // Riot manda "FiddleSticks"; el archivo es "Fiddlesticks.png".
    expect(championIconUrl("16.23.1", "FiddleSticks")).toBe(
      "https://ddragon.leagueoflegends.com/cdn/16.23.1/img/champion/Fiddlesticks.png",
    );
  });
});
