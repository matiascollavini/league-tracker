// Plataformas (platformId) y su cluster regional.
// Ojo: ACCOUNT-V1 y MATCH-V5 usan el host REGIONAL; summoner/league/mastery
// usan el host de PLATAFORMA. Equivocarse devuelve 403/404.


export const PLATFORMS = [
  "la1",
  "la2",
  "na1",
  "br1",
  "euw1",
  "eun1",
  "kr",
  "jp1",
  "oc1",
  "tr1",
  "ru",
  "ph2",
  "sg2",
  "th2",
  "vn2",
  "me1",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const CLUSTERS = ["americas", "asia", "europe", "sea"] as const;
export type Cluster = (typeof CLUSTERS)[number];

const PLATFORM_CLUSTER: Record<Platform, Cluster> = {
  la1: "americas",
  la2: "americas",
  na1: "americas",
  br1: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  me1: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  vn2: "sea",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  la1: "LAN · Latinoamérica Norte",
  la2: "LAS · Latinoamérica Sur",
  na1: "NA · Norteamérica",
  br1: "BR · Brasil",
  euw1: "EUW · Europa Oeste",
  eun1: "EUNE · Europa Nórdica y Este",
  kr: "KR · Corea",
  jp1: "JP · Japón",
  oc1: "OCE · Oceanía",
  tr1: "TR · Turquía",
  ru: "RU · Rusia",
  ph2: "PH · Filipinas",
  sg2: "SG · Singapur",
  th2: "TH · Tailandia",
  vn2: "VN · Vietnam",
  me1: "ME · Medio Oriente",
};

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function clusterFor(platform: Platform): Cluster {
  return PLATFORM_CLUSTER[platform];
}

export function platformFromEnv(): Platform {
  const value = process.env.RIOT_DEFAULT_PLATFORM?.toLowerCase() ?? "la2";
  return isPlatform(value) ? value : "la2";
}

/** Filas del <select> del buscador (agrupadas por cluster en la UI). */
export const PLATFORM_OPTIONS = PLATFORMS.map((value) => ({
  value,
  label: PLATFORM_LABEL[value],
}));

export type QueueFilterId = "all" | "solo" | "flex" | "normal" | "aram";

export const QUEUE_FILTERS: Array<{
  id: QueueFilterId;
  label: string;
  queues: number[];
}> = [
  { id: "all", label: "Todas", queues: [] },
  { id: "solo", label: "Solo/Duo", queues: [420] },
  { id: "flex", label: "Flex", queues: [440] },
  { id: "normal", label: "Normal", queues: [400, 430, 490] },
  { id: "aram", label: "ARAM", queues: [450, 900, 1700] },
];

export function isQueueFilter(value: string | undefined): value is QueueFilterId {
  return QUEUE_FILTERS.some((f) => f.id === value);
}

export function queuesFor(filter: QueueFilterId): number[] {
  return QUEUE_FILTERS.find((f) => f.id === filter)?.queues ?? [];
}

export const QUEUE_LABEL: Record<number, string> = {
  0: "Custom",
  400: "Normal (draft)",
  420: "Solo/Duo",
  430: "Normal (ciega)",
  440: "Flex",
  450: "ARAM",
  490: "Quickplay",
  700: "Clash",
  900: "URF",
  1700: "Arena",
};

export function queueLabel(queueId: number): string {
  return QUEUE_LABEL[queueId] ?? `Cola ${queueId}`;
}

/** Los custom no se pueden mostrar públicamente sin opt-in (política de Riot). */
export const CUSTOM_QUEUE_ID = 0;
