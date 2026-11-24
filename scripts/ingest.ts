#!/usr/bin/env tsx
/**
 * Ingesta de historial (worker manual).
 *
 *   npm run ingest -- "Nombre#TAG" la2 --budget=120 --pages=3
 *
 * - Descubre IDs de partidas (100 por página) y baja los detalles que falten.
 * - Es resumible: si cortás, la próxima corrida sigue donde quedó.
 * - Respeta el rate limit de la key (token bucket del cliente de Riot).
 *
 * Para bajar ~1.000 partidas con una dev key:
 *   npm run ingest -- "Nombre#TAG" la2 --budget=1100 --pages=10
 * (tarda ~20 minutos porque la dev key permite 100 requests cada 2 minutos).
 *
 * Con production key (30.000/10min) lo mismo tarda ~20 segundos.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const raw = match[2];
    if (!key || raw == null) continue;
    if (!(key in process.env)) process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    if (match) flags[match[1]!] = match[2]!;
    else positional.push(arg);
  }
  return { positional, flags };
}

async function main() {
  loadEnv();

  const { positional, flags } = parseArgs(process.argv.slice(2));
  const riotId = positional[0];
  const platform = (positional[1] ?? process.env.RIOT_DEFAULT_PLATFORM ?? "la2")
    .toLowerCase();

  if (!riotId || !riotId.includes("#")) {
    console.error(
      '\nUso: npm run ingest -- "Nombre#TAG" [la2] [--budget=120] [--pages=3]\n',
    );
    process.exit(1);
  }
  if (!process.env.RIOT_API_KEY?.trim()) {
    console.error("\nFalta RIOT_API_KEY en .env.local\n");
    process.exit(1);
  }

  const budget = Number(flags.budget ?? 120);
  const pages = Number(flags.pages ?? 10);
  const [gameName, tagLine] = riotId.split("#") as [string, string];

  // Import dinámico: así loadEnv() corre antes de que el módulo lea process.env.
  const { syncAccount } = await import("../src/lib/ingest");
  const { closeDb } = await import("../src/lib/db/client");
  const { isPlatform } = await import("../src/lib/riot/config");

  if (!isPlatform(platform)) {
    console.error(`\nPlataforma desconocida: ${platform}\n`);
    process.exit(1);
  }

  console.log(
    `\nIngesta — ${gameName}#${tagLine} en ${platform} · budget=${budget} · páginas=${pages}\n`,
  );

  const started = Date.now();
  let lastLog = 0;

  const result = await syncAccount(platform, gameName, tagLine, {
    budget: Number.isFinite(budget) ? budget : 120,
    maxPages: Number.isFinite(pages) ? pages : 10,
    onProgress: (message) => {
      const now = Date.now();
      if (now - lastLog > 400) {
        lastLog = now;
        console.log(`  · ${message}`);
      }
    },
  });

  const seconds = ((Date.now() - started) / 1_000).toFixed(1);
  console.log(`\n  ✔ ${result.progress.detailed} partidas con detalle`);
  console.log(`  · ${result.progress.known} partidas conocidas en total`);
  console.log(`  · ${result.requests} requests usados en ${seconds}s`);
  console.log(
    `  ${result.done ? "✔ historial completo" : "· quedan partidas: volvé a correr el comando"}\n`,
  );

  await closeDb();
}

main().catch((error) => {
  console.error("\nError:", error instanceof Error ? error.message : error);
  process.exit(1);
});
