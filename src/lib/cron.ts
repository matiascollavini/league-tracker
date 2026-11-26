import { timingSafeEqual } from "node:crypto";

/**
 * Piezas puras del cron propio (`POST/GET /api/cron`, ADR-028).
 *
 * Por qué existe: el `schedule` de GitHub Actions es "best effort" — en este
 * repo descartó ~98% de los eventos de un cron de 10 minutos (6 corridas en 48 h) — así que
 * la ingesta de fondo no puede depender de él. El endpoint hace una tanda
 * acotada del worker y lo dispara un cron externo gratuito (cron-job.org,
 * UptimeRobot, el scheduler de tu VPS...).
 *
 * Estas funciones están afuera del route para poder testearlas sin red ni base:
 * el route solo junta todo.
 */

/** Nombre del secreto que protege el endpoint. */
export const CRON_SECRET_ENV = "CRON_SECRET";

/**
 * Secreto presentado por el llamador: `Authorization: Bearer <secreto>` o, para
 * los cron que no mandan headers, `?key=<secreto>`. Devuelve null si no vino.
 */
export function presentedSecret(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim();
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (match?.[1]) return match[1].trim();
    // Algunos servicios mandan el token pelado, sin "Bearer".
    if (!header.includes(" ")) return header;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("key");
  return query?.trim() || null;
}

/**
 * Compara en tiempo constante y sin filtrar el largo del secreto. Si no hay
 * secreto configurado en el servidor devuelve `"missing"`: el route responde 503
 * y nunca corre la ingesta, así un deploy sin `CRON_SECRET` no queda abierto.
 */
export function checkSecret(
  presented: string | null,
  expected: string | undefined,
): "ok" | "missing" | "unauthorized" {
  const secret = expected?.trim();
  if (!secret) return "missing";
  if (!presented) return "unauthorized";

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  if (a.length !== b.length) {
    // Igual comparamos algo para no cortar antes por el largo.
    timingSafeEqual(b, b);
    return "unauthorized";
  }
  return timingSafeEqual(a, b) ? "ok" : "unauthorized";
}

function intFromEnv(raw: string | undefined, fallback: number, min: number, max: number): number {
  // Una variable vacía (o con espacios) es una variable sin configurar: en
  // Vercel es fácil dejar el campo en blanco.
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/**
 * Presupuesto de la tanda. El default es conservador a propósito: comparte el
 * rate limit de Riot con las visitas al sitio y con GitHub Actions.
 * Con dev key (100 req / 2 min ≈ 0,83/s) 40 requests son ~48 s.
 */
export function cronBudget(env: Record<string, string | undefined> = process.env): number {
  return intFromEnv(env.CRON_BUDGET, 40, 5, 300);
}

/** Tope de tiempo de la tanda. Vercel Hobby corta la función a los 60 s. */
export function cronDeadlineMs(env: Record<string, string | undefined> = process.env): number {
  return intFromEnv(env.CRON_DEADLINE_MS, 45_000, 5_000, 55_000);
}

/** Cuántos jugadores de la cola mira cada tanda. */
export function cronPlayers(env: Record<string, string | undefined> = process.env): number {
  return intFromEnv(env.CRON_PLAYERS, 3, 1, 5);
}

/** Tope por jugador dentro de la tanda (para que uno lento no se coma todo). */
export function cronPlayerSlice(remaining: number): number {
  return Math.max(1, Math.min(120, remaining));
}
