import { z } from "zod";

/**
 * Data Dragon: estáticos oficiales, sin key y sin rate limit.
 * Se cachea por proceso + en el Data Cache de Next.
 *
 * [GOTCHA] Los "realms" de DDragon usan códigos propios (na, lan, las...), NO
 * los platformId de Riot. No los derives: acá no los necesitamos.
 */

const DD = "https://ddragon.leagueoflegends.com";

export type Champion = {
  id: string;
  key: number;
  name: string;
  title: string;
  tags: string[];
};

export type ChampionCatalog = {
  version: string;
  locale: string;
  byKey: Map<number, Champion>;
  byId: Map<string, Champion>;
  all: Champion[];
};

const ChampionFileSchema = z.object({
  version: z.string(),
  data: z.record(
    z.string(),
    z.object({
      id: z.string(),
      key: z.string(),
      name: z.string(),
      title: z.string().default(""),
      tags: z.array(z.string()).default([]),
    }),
  ),
});

export function ddragonLocale(): string {
  return process.env.DD_LOCALE?.trim() || "es_ES";
}

async function fetchJson(url: string, revalidate: number): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Data Dragon ${res.status} en ${url}`);
  return res.json();
}

let cached: { key: string; catalog: ChampionCatalog } | null = null;

/** Catálogo de campeones del patch actual, en el locale configurado. */
export async function getChampionCatalog(): Promise<ChampionCatalog> {
  const locale = ddragonLocale();
  if (cached?.key === locale) return cached.catalog;

  try {
    const versions: unknown = await fetchJson(`${DD}/api/versions.json`, 3_600);
    const version = z.array(z.string()).parse(versions)[0] ?? "16.23.1";

    const raw = await fetchJson(
      `${DD}/cdn/${version}/data/${locale}/champion.json`,
      86_400,
    );
    const file = ChampionFileSchema.parse(raw);

    const all: Champion[] = Object.values(file.data).map((champion) => ({
      id: champion.id,
      key: Number(champion.key),
      name: champion.name,
      title: champion.title,
      tags: champion.tags,
    }));

    const catalog: ChampionCatalog = {
      version,
      locale,
      all,
      byKey: new Map(all.map((champion) => [champion.key, champion])),
      byId: new Map(all.map((champion) => [champion.id, champion])),
    };

    cached = { key: locale, catalog };
    return catalog;
  } catch {
    // Si DDragon no responde, seguimos con lo mínimo para no romper la página.
    const catalog = fallbackCatalog(locale);
    cached = { key: locale, catalog };
    return catalog;
  }
}

export function championIconUrl(version: string, championId: string): string {
  return `${DD}/cdn/${version}/img/champion/${championId}.png`;
}

export function profileIconUrl(version: string, iconId: number): string {
  return `${DD}/cdn/${version}/img/profileicon/${iconId}.png`;
}

export function splashUrl(championId: string, skin = 0): string {
  return `${DD}/cdn/img/champion/splash/${championId}_${skin}.jpg`;
}

const FALLBACK: Champion[] = [
  { id: "Ahri", key: 103, name: "Ahri", title: "", tags: [] },
  { id: "Jinx", key: 222, name: "Jinx", title: "", tags: [] },
  { id: "Lux", key: 99, name: "Lux", title: "", tags: [] },
  { id: "Darius", key: 122, name: "Darius", title: "", tags: [] },
  { id: "Thresh", key: 412, name: "Thresh", title: "", tags: [] },
  { id: "LeeSin", key: 64, name: "Lee Sin", title: "", tags: [] },
  { id: "KaiSa", key: 145, name: "Kai'Sa", title: "", tags: [] },
  { id: "Aatrox", key: 266, name: "Aatrox", title: "", tags: [] },
  { id: "Yasuo", key: 157, name: "Yasuo", title: "", tags: [] },
  { id: "Akali", key: 84, name: "Akali", title: "", tags: [] },
];

function fallbackCatalog(locale: string): ChampionCatalog {
  return {
    version: "latest",
    locale,
    all: FALLBACK,
    byKey: new Map(FALLBACK.map((champion) => [champion.key, champion])),
    byId: new Map(FALLBACK.map((champion) => [champion.id, champion])),
  };
}
