import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function apply(file: string, override: boolean) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const raw = m[2];
    if (!key || raw == null) continue;
    if (override || !(key in process.env)) {
      process.env[key] = raw.replace(/^["']|["']$/g, "");
    }
  }
}

/**
 * Carga `.env.local` (desarrollo). Con `--prod` o `TURSO=1` carga además
 * `.env.turso.local`, que apunta a la base de producción (Turso).
 */
export function loadEnv(): void {
  const prod =
    process.argv.includes("--prod") || process.env.TURSO === "1";
  apply(".env.local", false);
  if (prod) apply(".env.turso.local", true);
}
