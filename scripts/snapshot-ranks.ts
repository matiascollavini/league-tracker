#!/usr/bin/env tsx
/**
 * Fotos de rango (ADR-026).
 *
 * Riot no expone historial de rango: `league-v4` devuelve solo el estado
 * actual. Este job recorre las cuentas de la cola (`puuid_sync`, las que el
 * worker ya ingesta) y guarda una foto por cambio de tier/división/LP en
 * `league_history`. Esas fotos son los puntos del gráfico del perfil.
 *
 *   npm run snapshot:ranks                        # 6 min, 400 cuentas
 *   npm run snapshot:ranks -- --minutes=2 --budget=100
 *   npm run snapshot:ranks -- --prod             # contra Turso (.env.turso.local)
 *
 * Costo: 1 request por cuenta (`entries/by-puuid` trae todas las colas juntas).
 * Respeta el token bucket de la key y corta por deadline, así que se puede
 * correr en un cron sin pasarse del rate limit.
 */

import { loadEnv } from "./env";

function flag(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(value) ? value : fallback;
}

const QUEUE_SHORT: Record<string, string> = {
  RANKED_SOLO_5x5: "Solo",
  RANKED_FLEX_SR: "Flex",
};

async function main() {
  loadEnv();

  if (!process.env.RIOT_API_KEY?.trim()) {
    console.error("Falta RIOT_API_KEY");
    process.exit(1);
  }

  const minutes = Math.max(1, flag("minutes", 6));
  const budget = Math.max(1, flag("budget", 400));
  const startedAt = Date.now();
  const deadline = startedAt + minutes * 60_000;

  const { listRankSnapshotTargets, recordRankPoll, recordLeagueHistory } =
    await import("../src/lib/db/rank-history");
  const { fetchLeagueEntries } = await import("../src/lib/riot/account");
  const { RiotApiError, RiotDeadlineError } = await import("../src/lib/riot/http");
  const { closeDb } = await import("../src/lib/db/client");

  // Una sola lista: las cuentas a las que hace más tiempo que no les miramos el
  // rango. Con budget < total la cola rota sola entre corridas.
  const targets = await listRankSnapshotTargets(budget);
  console.log(
    `\nSnapshots de rango — ${minutes} min · hasta ${budget} cuentas · ${targets.length} en esta vuelta`,
  );

  let used = 0;
  let ranked = 0;
  let unranked = 0;
  let failed = 0;

  for (const target of targets) {
    if (Date.now() >= deadline || used >= budget) break;
    used += 1;

    try {
      const entries = await fetchLeagueEntries(
        target.puuid,
        target.platform,
        deadline,
      );
      const now = Date.now();

      if (entries.length === 0) {
        unranked += 1;
        console.log(`  · ${target.label.padEnd(22)} sin rango`);
      } else {
        await recordLeagueHistory(target.puuid, target.platform, entries, now);
        ranked += 1;
        const detail = entries
          .map(
            (entry) =>
              `${QUEUE_SHORT[entry.queueType] ?? entry.queueType} ${entry.tier ?? "?"} ${entry.rank ?? ""} ${entry.leaguePoints ?? 0} LP`,
          )
          .join(" · ")
          .replace(/\s+/g, " ");
        console.log(`  · ${target.label.padEnd(22)} ${detail}`);
      }

      // Se marca consultada también cuando no tiene rango: si no, esas cuentas
      // volverían siempre al principio de la cola.
      await recordRankPoll(target.puuid, now);
    } catch (error) {
      if (error instanceof RiotDeadlineError) {
        console.log("  · se acabó el tiempo de esta corrida");
        break;
      }

      // Key vencida: no tiene sentido seguir gastando tiempo en 401/403.
      if (
        error instanceof RiotApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        console.error(
          `\nLa key de Riot no autoriza (${error.status}). Regenerala en https://developer.riotgames.com`,
        );
        await closeDb();
        process.exit(1);
      }

      // 404 = cuenta sin rank (ver docs/API-LOL.txt §7.4): es un resultado, no
      // un fallo. Se marca consultada y se sigue.
      if (error instanceof RiotApiError && error.status === 404) {
        unranked += 1;
        await recordRankPoll(target.puuid, Date.now());
        console.log(`  · ${target.label.padEnd(22)} sin rango`);
        continue;
      }

      failed += 1;
      console.warn(
        `  · ${target.label.padEnd(22)} error: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  console.log(
    `\n  ${used} cuentas · ${ranked} con rango · ${unranked} sin rango · ${failed} errores · ${((Date.now() - startedAt) / 1000).toFixed(0)}s\n`,
  );

  await closeDb();
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
