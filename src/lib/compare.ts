import { isPlatform, type Platform } from "@/lib/riot/config";
import { percent, type ChampionStat, type PlayerSummary } from "@/lib/riot/aggregate";
import { decodeParam } from "@/lib/params";

/**
 * Un lado del comparador: plataforma + Riot ID.
 * En la URL viaja como "la2/Carlos/RHLMC" (los nombres de Riot no llevan "/").
 */
export type CompareSide = {
  platform: Platform;
  gameName: string;
  tagLine: string;
};

export function parseSide(value: string | undefined): CompareSide | null {
  if (!value) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const [rawPlatform, rawName, rawTag] = parts as [string, string, string];
  const platform = rawPlatform.toLowerCase();
  if (!isPlatform(platform)) return null;

  // Los query params de Next ya vienen decodificados; decodeParam es seguro igual.
  const gameName = decodeParam(rawName).trim();
  const tagLine = decodeParam(rawTag).trim();
  if (!gameName || !tagLine) return null;

  return { platform, gameName, tagLine };
}

export function sideParam(side: CompareSide): string {
  return `${side.platform}/${encodeURIComponent(side.gameName)}/${encodeURIComponent(side.tagLine)}`;
}

export type ComparePlayer = {
  name: string;
  tag: string;
  platform: Platform;
  summary: PlayerSummary;
  /** "Gold IV · 84 LP" o null si no tiene rango. */
  rank: string | null;
  recent: { wins: number; games: number };
  pool: ChampionStat[];
};

export type Metric = {
  label: string;
  a: string;
  b: string;
  /** Lado que gana esta métrica (null = empate o no comparable). */
  winner: "a" | "b" | null;
};

function compareNumbers(
  a: number,
  b: number,
  higherIsBetter = true,
): "a" | "b" | null {
  if (Math.abs(a - b) < 1e-9) return null;
  const aWins = higherIsBetter ? a > b : a < b;
  return aWins ? "a" : "b";
}

export function buildMetrics(a: ComparePlayer, b: ComparePlayer): Metric[] {
  const mainA = a.pool[0];
  const mainB = b.pool[0];

  const rows: Metric[] = [
    {
      label: "Partidas analizadas",
      a: String(a.summary.matches),
      b: String(b.summary.matches),
      winner: null,
    },
    {
      label: "Winrate",
      a: percent(a.summary.winrate),
      b: percent(b.summary.winrate),
      winner:
        a.summary.matches > 0 && b.summary.matches > 0
          ? compareNumbers(a.summary.winrate, b.summary.winrate)
          : null,
    },
    {
      label: "KDA promedio",
      a: a.summary.kda.toFixed(2),
      b: b.summary.kda.toFixed(2),
      winner:
        a.summary.matches > 0 && b.summary.matches > 0
          ? compareNumbers(a.summary.kda, b.summary.kda)
          : null,
    },
    {
      label: "Campeón más jugado",
      a: mainA?.championName ?? "—",
      b: mainB?.championName ?? "—",
      winner: null,
    },
    {
      label: "Partidas con su main",
      a: String(mainA?.games ?? 0),
      b: String(mainB?.games ?? 0),
      winner: null,
    },
    {
      label: "Winrate con su main",
      a: mainA ? percent(mainA.winrate) : "—",
      b: mainB ? percent(mainB.winrate) : "—",
      winner:
        mainA && mainB ? compareNumbers(mainA.winrate, mainB.winrate) : null,
    },
    {
      label: "Rango (Solo/Duo)",
      a: a.rank ?? "Sin clasificar",
      b: b.rank ?? "Sin clasificar",
      winner: null,
    },
    {
      label: "Forma reciente (20)",
      a: `${a.recent.wins}V · ${a.recent.games - a.recent.wins}D`,
      b: `${b.recent.wins}V · ${b.recent.games - b.recent.wins}D`,
      winner:
        a.recent.games > 0 && b.recent.games > 0
          ? compareNumbers(a.recent.wins, b.recent.wins)
          : null,
    },
  ];

  return rows;
}
