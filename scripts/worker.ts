#!/usr/bin/env tsx
/**
 * Worker de ingesta. Corre en un cron (GitHub Actions) o a mano.
 *
 *   npm run worker                        # 8 min, 1.000 requests, 5 jugadores por vuelta
 *   npm run worker -- --minutes=5 --budget=250
 *
 * Toma de la cola a los jugadores con historial incompleto, les baja partidas
 * con un presupuesto acotado y vuelve a encolar el resto. Es idempotente y
 * respeta el rate limit (token bucket del cliente de Riot).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const raw = m[2];
    if (!key || raw == null) continue;
    if (!(key in process.env)) process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

function flag(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  loadEnv();

  if (!process.env.RIOT_API_KEY?.trim()) {
    console.error("Falta RIOT_API_KEY");
    process.exit(1);
  }

  const minutes = flag("minutes", 8);
  const budget = flag("budget", 1_000);
  const batch = flag("players", 5);

  const { syncPuuid } = await import("../src/lib/ingest");
  const { listPendingPlayers, countPendingPlayers } = await import(
    "../src/lib/db/matches"
  );
  const { closeDb } = await import("../src/lib/db/client");

  const deadline = Date.now() + minutes * 60_000;
  let used = 0;
  let processed = 0;

  console.log(
    `\nWorker — ${minutes} min · budget ${budget} requests · ${batch} jugadores por vuelta`,
  );
  console.log(`Pendientes al arrancar: ${await countPendingPlayers()}\n`);

  while (Date.now() < deadline && used < budget) {
    const players = await listPendingPlayers(batch);
    if (players.length === 0) {
      console.log("  ✔ no queda nada pendiente");
      break;
    }

    for (const player of players) {
      if (Date.now() >= deadline || used >= budget) break;

      const slice = Math.min(120, budget - used);
      const result = await syncPuuid(player.puuid, player.platform, {
        budget: slice,
        maxPages: 3,
        gameName: player.gameName ?? undefined,
        tagLine: player.tagLine ?? undefined,
      });

      used += result.requests;
      processed += 1;

      const label = `${player.gameName ?? player.puuid.slice(0, 8)}${player.tagLine ? `#${player.tagLine}` : ""}`;
      console.log(
        `  · ${label.padEnd(22)} ${result.progress.detailed}/${result.progress.known}` +
          `${result.done ? " ✔" : ""}${result.skipped ? " (lock)" : ""} · ${result.requests} req`,
      );
    }
  }

  console.log(
    `\n  ${processed} jugadores · ${used} requests · ${((Date.now() - (deadline - minutes * 60_000)) / 1000).toFixed(0)}s`,
  );
  console.log(`  Pendientes al terminar: ${await countPendingPlayers()}\n`);

  await closeDb();
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
