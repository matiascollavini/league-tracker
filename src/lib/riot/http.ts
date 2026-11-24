import { z } from "zod";
import { clusterFor, type Cluster, type Platform } from "./config";

/**
 * Cliente HTTP de Riot.
 *
 * Reglas que implementa (ver docs/API-LOL.txt, secciones 4 y 6):
 *  - Header X-Riot-Token (nunca en la URL).
 *  - Token bucket por proceso con las dos ventanas de la key personal/dev
 *    (20 req/s y 100 req/2min). Configurable por env para production key.
 *  - Reintento con Retry-After en 429 y backoff en 5xx.
 *  - Validación con zod de cada respuesta.
 *  - Caché de Next (Data Cache) vía `next.revalidate`.
 */

export class RiotApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly path: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("RIOT_API_KEY no configurada");
    this.name = "MissingApiKeyError";
  }
}

export function hasApiKey(): boolean {
  return Boolean(process.env.RIOT_API_KEY?.trim());
}

/**
 * Modo demo: muestra datos de ejemplo. Solo en desarrollo, o si se pide
 * explícitamente con RIOT_DEMO=1. En producción sin key preferimos mostrar un
 * error antes que datos falsos.
 */
export function isMockMode(): boolean {
  if (hasApiKey()) return false;
  return process.env.NODE_ENV !== "production" || process.env.RIOT_DEMO === "1";
}

function intFromEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

type LimitWindow = { limit: number; ms: number };

function limitWindows(): LimitWindow[] {
  return [
    { limit: intFromEnv("RIOT_RATE_LIMIT_PER_SECOND", 20), ms: 1_000 },
    { limit: intFromEnv("RIOT_RATE_LIMIT_PER_2MIN", 100), ms: 120_000 },
  ];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Token bucket de ventana deslizante. Vive en memoria del proceso: sirve para
 * dev y para el worker. En serverless cada invocación es un proceso nuevo, por
 * eso el ingest pesado NO va acá (ver docs/API-LOL.txt §10).
 */
class SlidingWindowLimiter {
  private stamps: number[] = [];

  constructor(private readonly windows: LimitWindow[]) {}

  async acquire(): Promise<void> {
    for (;;) {
      const now = Date.now();
      const maxMs = Math.max(...this.windows.map((w) => w.ms));
      this.stamps = this.stamps.filter((t) => now - t < maxMs);

      let waitMs = 0;
      for (const window of this.windows) {
        const inWindow = this.stamps.filter((t) => now - t < window.ms);
        if (inWindow.length >= window.limit) {
          const oldest = inWindow[inWindow.length - window.limit];
          if (oldest !== undefined) {
            waitMs = Math.max(waitMs, window.ms - (now - oldest) + 5);
          }
        }
      }

      if (waitMs <= 0) {
        this.stamps.push(now);
        return;
      }
      await sleep(waitMs);
    }
  }
}

const limiter = new SlidingWindowLimiter(limitWindows());

/**
 * Destino del request. Es un union discriminado a propósito: Riot tiene DOS
 * familias de hosts y confundirlas devuelve 403/404.
 *   cluster  -> account-v1 y match-v5      (americas | asia | europe | sea)
 *   platform -> summoner, league, mastery  (la1, la2, na1, kr, ...)
 * Ver docs/API-LOL.txt §5.
 */
export type RiotTarget =
  | { cluster: Cluster; platform?: never }
  | { platform: Platform; cluster?: never };

type RiotRequestOptions<T> = RiotTarget & {
  /** Segundos de caché de Next. 0 = no cachear. */
  revalidate?: number;
  tags?: string[];
  /** Esquema de validación de la respuesta. */
  schema: z.ZodType<T>;
};

/** Host base según el destino. Exportado para poder testearlo. */
export function riotHost(target: RiotTarget): string {
  const host = "cluster" in target ? target.cluster : target.platform;
  return `${host}.api.riotgames.com`;
}

async function errorMessage(res: Response, path: string): Promise<string> {
  try {
    const body: unknown = await res.json();
    const parsed = z
      .object({ status: z.object({ message: z.string() }).optional() })
      .safeParse(body);
    if (parsed.success && parsed.data.status?.message) {
      return `${res.status} ${parsed.data.status.message} (${path})`;
    }
  } catch {
    // el cuerpo de error no está garantizado como JSON
  }
  return `${res.status} ${res.statusText || "Error de Riot"} (${path})`;
}

export async function riotFetch<T>(
  path: string,
  options: RiotRequestOptions<T>,
): Promise<T> {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) throw new MissingApiKeyError();

  const { revalidate = 60, tags, schema } = options;
  const url = `https://${riotHost(options)}${path}`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    await limiter.acquire();

    const res = await fetch(url, {
      headers: { "X-Riot-Token": key },
      next: revalidate > 0 ? { revalidate, tags } : undefined,
      cache: revalidate > 0 ? undefined : "no-store",
    });

    if (res.ok) {
      const json: unknown = await res.json();
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new RiotApiError(
          502,
          `Respuesta inesperada de Riot en ${path}: ${parsed.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join(".")} ${i.message}`)
            .join("; ")}`,
          path,
        );
      }
      return parsed.data;
    }

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "1");
      const seconds = Number.isFinite(retryAfter) ? retryAfter : 1;
      lastError = new RiotApiError(429, `Rate limit de Riot (${path})`, path);
      await sleep((seconds + Math.random()) * 1_000);
      continue;
    }

    if (res.status >= 500) {
      lastError = new RiotApiError(
        res.status,
        await errorMessage(res, path),
        path,
      );
      await sleep(600 * 2 ** attempt + Math.random() * 300);
      continue;
    }

    throw new RiotApiError(res.status, await errorMessage(res, path), path);
  }

  if (lastError instanceof Error) throw lastError;
  throw new RiotApiError(503, `No se pudo completar ${path}`, path);
}

/** Concurrencia acotada para no reventar el bucket al bajar partidas. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      for (;;) {
        const index = cursor++;
        if (index >= items.length) return;
        const item = items[index];
        if (item === undefined) continue;
        out[index] = await fn(item);
      }
    },
  );

  await Promise.all(workers);
  return out;
}
