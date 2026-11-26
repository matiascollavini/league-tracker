/**
 * Historial de rango (LP) de un jugador.
 *
 * Riot **no** expone un endpoint de historial de rango: `league-v4` devuelve
 * solo el estado actual. Por eso el historial lo construye el proyecto con
 * fotos propias (tabla `league_history`), tomadas cada vez que se abre el
 * perfil. Este módulo es puro: normaliza una foto (tier + división + LP) a un
 * único número comparable (LP absoluto en la escalera) y arma la serie que
 * dibuja el gráfico.
 *
 * Escalera: Hierro IV 0 LP = 0. Cada tier con divisiones son 4 × 100 LP
 * (Hierro → Diamante). Maestro, Gran Maestro y Retador no tienen división y
 * siguen la misma escalera desde `APEX_BASE_LP`.
 */

/** Tiers con divisiones (IV..I), en orden ascendente. */
const DIVISIONED_TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
] as const;

/** Divisiones dentro de un tier: IV es la más baja y I la más alta. */
const DIVISION_OFFSET: Record<string, number> = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300,
};

/** LP absoluto donde arranca Maestro (fin de Diamante I). */
export const APEX_BASE_LP = DIVISIONED_TIERS.length * 400;

/** Colas con rango que muestra el perfil (Solo/Duo y Flex). */
export const RANKED_QUEUE_TYPES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"] as const;

/** Nombre visible de cada tier, como en el cliente en español. */
export const TIER_LABEL: Record<string, string> = {
  IRON: "Hierro",
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  PLATINUM: "Platino",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Maestro",
  GRANDMASTER: "Gran Maestro",
  CHALLENGER: "Retador",
};

/**
 * Color de cada tier (los mismos de las tarjetas de rango de dpm, ver
 * `theme-rft`). Se usa tanto en el texto del rango como en el gráfico.
 */
export const TIER_HEX: Record<string, string> = {
  IRON: "#9a9b9e",
  BRONZE: "#ca5e16",
  SILVER: "#e8e9e9",
  GOLD: "#ffd147",
  PLATINUM: "#9fe4f9",
  EMERALD: "#4ac97f",
  DIAMOND: "#7988ec",
  MASTER: "#bd9bf8",
  GRANDMASTER: "#f03b38",
  CHALLENGER: "#82dcf7",
};

const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/** Una foto del rango en un momento dado (fila de `league_history`). */
export type RankHistoryRow = {
  /** epoch ms en que observamos el rango. */
  ts: number;
  tier: string;
  /** División ("I".."IV"); null en Maestro+ y en datos viejos. */
  division: string | null;
  leaguePoints: number;
};

/** Foto + cola a la que pertenece (lo que devuelve la capa de base). */
export type RankHistoryEntry = RankHistoryRow & { queueType: string };

/** Punto listo para el gráfico. */
export type RankPoint = RankHistoryRow & {
  /** LP absoluto en la escalera (Hierro IV 0 LP = 0). */
  lp: number;
  /** Etiqueta legible: "Platino II 64 LP". */
  label: string;
};

function normalizeTier(tier: string): string {
  return tier.trim().toUpperCase();
}

function normalizeDivision(division: string | null | undefined): string | null {
  if (!division) return null;
  const value = division.trim().toUpperCase();
  return DIVISION_OFFSET[value] === undefined ? null : value;
}

/**
 * Convierte una foto (tier + división + LP) en un único LP absoluto, para que
 * el eje sea continuo: subir de división no hace saltar la línea.
 *
 * Devuelve null si el tier no se reconoce (dato raro de Riot): ese punto se
 * descarta en vez de romper el gráfico.
 */
export function absoluteLp(
  tier: string,
  division: string | null | undefined,
  leaguePoints: number,
): number | null {
  const name = normalizeTier(tier);
  if (!name) return null;
  const lp = Number.isFinite(leaguePoints) ? Math.max(0, Math.round(leaguePoints)) : 0;

  if (APEX_TIERS.has(name)) return APEX_BASE_LP + lp;

  const index = DIVISIONED_TIERS.indexOf(
    name as (typeof DIVISIONED_TIERS)[number],
  );
  if (index < 0) return null;
  const offset = DIVISION_OFFSET[normalizeDivision(division) ?? "IV"] ?? 0;
  return index * 400 + offset + lp;
}

/** Etiqueta de una foto real (usa el tier guardado, no lo deduce del LP). */
export function rankLabel(row: RankHistoryRow): string {
  const tier = normalizeTier(row.tier);
  const name = TIER_LABEL[tier] ?? tier;
  const division = APEX_TIERS.has(tier) ? "" : ` ${normalizeDivision(row.division) ?? "IV"}`;
  return `${name}${division} ${Math.max(0, Math.round(row.leaguePoints))} LP`;
}

/**
 * Convierte un LP absoluto de vuelta a tier + división + LP. En Maestro+ no se
 * puede distinguir Gran Maestro de Retador solo con LP: devuelve MASTER.
 */
export function fromAbsoluteLp(lp: number): RankHistoryRow {
  const value = Math.max(0, Math.round(lp));
  if (value >= APEX_BASE_LP) {
    return {
      ts: 0,
      tier: "MASTER",
      division: null,
      leaguePoints: value - APEX_BASE_LP,
    };
  }
  const index = Math.min(
    DIVISIONED_TIERS.length - 1,
    Math.floor(value / 400),
  );
  const rest = value - index * 400;
  const division =
    rest >= 300 ? "I" : rest >= 200 ? "II" : rest >= 100 ? "III" : "IV";
  return {
    ts: 0,
    tier: DIVISIONED_TIERS[index] ?? "IRON",
    division,
    leaguePoints: rest % 100,
  };
}

/** Etiqueta corta para una línea de la grilla del gráfico, deducida del LP
 * absoluto. En Maestro+ se muestra el LP crudo (no se puede saber el tier). */
export function ladderLabel(lp: number): string {
  if (lp >= APEX_BASE_LP) return `${Math.round(lp - APEX_BASE_LP)} LP`;
  const rank = fromAbsoluteLp(lp);
  return `${TIER_LABEL[rank.tier] ?? rank.tier} ${rank.division}`;
}

/**
 * Serie ordenada y sin puntos rotos. Descarta tiers desconocidos, ordena por
 * tiempo y, si dos fotos caen en el mismo milisegundo, se queda con la última.
 */
export function buildRankSeries(rows: readonly RankHistoryRow[]): RankPoint[] {
  const byTs = new Map<number, RankPoint>();

  for (const row of rows) {
    const lp = absoluteLp(row.tier, row.division, row.leaguePoints);
    if (lp === null) continue;
    const ts = Number(row.ts);
    if (!Number.isFinite(ts) || ts <= 0) continue;
    byTs.set(ts, {
      ...row,
      division: normalizeDivision(row.division),
      lp,
      label: rankLabel(row),
    });
  }

  return [...byTs.values()].sort((a, b) => a.ts - b.ts);
}

export type LpDomain = {
  /** Piso del eje (múltiplo de `step`). */
  lo: number;
  /** Techo del eje (múltiplo de `step`). */
  hi: number;
  /** Separación entre líneas de grilla. */
  step: number;
  /** Valores de las grillas interiores (sin los bordes). */
  ticks: number[];
};

/**
 * Eje vertical del gráfico: redondea a múltiplos de 50/100/200/400 LP para que
 * las grillas caigan en divisiones reales y no en números arbitrarios.
 */
export function lpDomain(points: readonly RankPoint[]): LpDomain {
  const firstPoint = points[0];
  if (!firstPoint) return { lo: 0, hi: 400, step: 100, ticks: [100, 200, 300] };

  let min = firstPoint.lp;
  let max = firstPoint.lp;
  for (const point of points) {
    if (point.lp < min) min = point.lp;
    if (point.lp > max) max = point.lp;
  }

  if (min === max) {
    min -= 50;
    max += 50;
  }

  const span = max - min;
  const pad = Math.max(50, span * 0.12);
  const step = span + pad * 2 <= 150 ? 50 : span + pad * 2 <= 350 ? 100 : span + pad * 2 <= 700 ? 200 : 400;
  const lo = Math.max(0, Math.floor((min - pad) / step) * step);
  const hi = Math.max(lo + step, Math.ceil((max + pad) / step) * step);

  const ticks: number[] = [];
  for (let value = lo + step; value < hi; value += step) ticks.push(value);

  return { lo, hi, step, ticks };
}

/**
 * Extiende el último valor conocido de cada cola hasta `now`.
 *
 * El historial solo gana un punto cuando cambia el LP, así que la última
 * medición puede ser de hace días. La tarjeta ya muestra ese mismo rango como
 * el actual, así que dibujar la línea hasta hoy no inventa nada; sin esto el
 * gráfico terminaría en la fecha de la última visita. Se pide (a) al menos dos
 * mediciones reales, para no convertir un único punto en una línea plana, y
 * (b) que Riot haya respondido: con `stale` (foto de fallback) no sabemos el
 * rango de hoy.
 */
export function extendRankHistory(
  rows: readonly RankHistoryEntry[],
  now: number,
  options: { stale?: boolean } = {},
): RankHistoryEntry[] {
  const valid = rows.filter(
    (row) => absoluteLp(row.tier, row.division, row.leaguePoints) !== null,
  );
  if (options.stale) return [...valid];

  const count = new Map<string, number>();
  const lastByQueue = new Map<string, RankHistoryEntry>();
  for (const row of valid) {
    count.set(row.queueType, (count.get(row.queueType) ?? 0) + 1);
    const last = lastByQueue.get(row.queueType);
    if (!last || row.ts > last.ts) lastByQueue.set(row.queueType, row);
  }

  const out = [...valid];
  for (const [queueType, last] of lastByQueue) {
    if ((count.get(queueType) ?? 0) < 2) continue;
    if (now - last.ts <= 60_000) continue;
    out.push({ ...last, ts: now });
  }
  return out.sort((a, b) => a.ts - b.ts);
}
