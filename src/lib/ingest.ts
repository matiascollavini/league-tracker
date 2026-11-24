import type { Platform } from "@/lib/riot/config";
import { getMatch, getMatchIdsPage } from "@/lib/riot/matches";
import { resolveAccount } from "@/lib/riot/account";
import type { Account, Match } from "@/lib/riot/types";
import {
  filterKnownMatchIds,
  getProgress,
  getSyncState,
  pendingMatchIds,
  registerMatchIds,
  saveMatch,
  touchSyncState,
  tryLockSync,
  unlockSync,
  type Progress,
} from "@/lib/db/matches";

/**
 * Ingesta: descubre IDs de partidas y baja los detalles que falten.
 *
 * Presupuesto: cada request a Riot cuesta 1. Con dev key hay 100 cada 2 min,
 * así que la función acepta `budget` para no pasarse. Es resumible: si corta
 * a la mitad, la próxima corrida sigue donde quedó (los IDs están guardados y
 * solo baja los detalles que faltan).
 */

export type IngestOptions = {
  /** Requests totales permitidos en esta corrida. */
  budget?: number;
  /** Páginas de 100 IDs a recorrer hacia atrás. */
  maxPages?: number;
  /** Se llama por cada partida guardada (para logs del CLI). */
  onProgress?: (message: string) => void;
};

export type IngestResult = {
  account: Account;
  progress: Progress;
  requests: number;
  /** true si ya se recorrió todo el historial disponible y no quedan pendientes. */
  done: boolean;
};

export async function syncAccount(
  platform: Platform,
  gameName: string,
  tagLine: string,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const account = await resolveAccount(platform, gameName, tagLine);
  const puuid = account.puuid;
  const budget = Math.max(1, options.budget ?? 30);
  let remaining = budget;

  const previous = await getSyncState(puuid);
  // Si el backfill ya terminó, alcanza con mirar la primera página (partidas nuevas).
  const maxPages =
    previous?.backfillState === "done" ? 1 : Math.max(1, options.maxPages ?? 10);

  const lock = await tryLockSync(puuid, platform, 300);
  if (!lock) {
    return {
      account,
      progress: await getProgress(puuid),
      requests: 0,
      done: false,
    };
  }

  try {
    await touchSyncState(puuid, platform, {
      gameName,
      tagLine,
      backfillState: "running",
    });

    let cursor = 0;
    let reachedEnd = false;

    for (let page = 0; page < maxPages; page++) {
      if (remaining <= 0) break;

      const start = page * 100;
      const ids = await getMatchIdsPage(puuid, platform, start, 100);
      remaining -= 1;

      if (ids.length === 0) {
        reachedEnd = true;
        break;
      }

      await registerMatchIds(puuid, ids);
      cursor = start + ids.length;
      options.onProgress?.(`página ${page + 1}: ${ids.length} IDs`);

      if (ids.length < 100) {
        reachedEnd = true;
        break;
      }
    }

    await touchSyncState(puuid, platform, {
      idsCursor: cursor,
      backfillState: reachedEnd ? "done" : "partial",
    });

    // Detalles pendientes (en tandas para no armar arrays gigantes).
    while (remaining > 0) {
      const pending = await pendingMatchIds(puuid, Math.min(remaining, 20));
      if (pending.length === 0) break;

      const known = new Set(await filterKnownMatchIds(pending));
      for (const matchId of pending) {
        if (remaining <= 0) break;
        if (known.has(matchId)) continue;

        const match: Match = await getMatch(matchId, platform);
        remaining -= 1;
        await saveMatch(match, platform);
        options.onProgress?.(`guardada ${matchId}`);
      }
    }

    await touchSyncState(puuid, platform, { lastSyncedAt: Date.now() });

    const progress = await getProgress(puuid);
    return {
      account,
      progress,
      requests: budget - remaining,
      done: reachedEnd && progress.detailed >= progress.known,
    };
  } finally {
    await unlockSync(puuid, lock);
  }
}
