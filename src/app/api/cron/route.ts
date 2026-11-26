import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkSecret,
  cronBudget,
  cronDeadlineMs,
  cronPlayers,
  cronPlayerSlice,
  CRON_SECRET_ENV,
  presentedSecret,
} from "@/lib/cron";
import { syncPuuid } from "@/lib/ingest";
import {
  countPendingPlayers,
  listPendingPlayers,
  touchSyncState,
} from "@/lib/db/matches";
import { hasApiKey } from "@/lib/riot/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron propio de ingesta (ADR-028).
 *
 * Hace **una tanda acotada** del worker: toma los jugadores pendientes de la
 * cola (`puuid_sync`), les baja partidas con un presupuesto de requests y un
 * deadline, y devuelve qué hizo. Es idempotente y resumible: si se corta por
 * tiempo, la próxima tanda sigue donde quedó.
 *
 * Lo dispara un cron externo gratuito (cron-job.org, UptimeRobot, un `crontab`
 * propio) cada 5 minutos:
 *
 *     curl -fsS -X POST https://tu-sitio/api/cron \
 *       -H "Authorization: Bearer $CRON_SECRET"
 *
 * **Por qué no GitHub Actions**: su `schedule` es "best effort" y en este repo
 * descartó ~98% de los eventos de un cron de 10 minutos (6 corridas en 48 h). El workflow
 * sigue vivo para backfills largos a mano (`workflow_dispatch`), pero la
 * ingesta de fondo no depende de él.
 *
 * Reglas que respeta:
 *   - sin `CRON_SECRET` configurado responde 503 y **no** toca la base;
 *   - la auth se valida antes de cualquier consulta (un escaneo de internet no
 *     gasta lecturas de Turso);
 *   - el presupuesto de requests y el deadline son chicos: comparte el rate
 *     limit de Riot con las visitas al sitio;
 *   - los locks por jugador (`tryLockSync`) evitan que dos tandas se pisen.
 */

const RoundResponse = z.object({
  ok: z.boolean(),
  elapsedMs: z.number(),
  requests: z.number(),
  pendingBefore: z.number(),
  pendingAfter: z.number(),
  /** Si Riot pidió esperar (429), cuánto. El cron externo no lo necesita: reintenta igual. */
  retryAfterMs: z.number().optional(),
  players: z.array(
    z.object({
      label: z.string(),
      platform: z.string(),
      detailed: z.number(),
      known: z.number(),
      requests: z.number(),
      phase: z.string(),
      done: z.boolean(),
      skipped: z.boolean(),
      error: z.string().optional(),
    }),
  ),
});

async function run(request: Request): Promise<NextResponse> {
  const auth = checkSecret(presentedSecret(request), process.env[CRON_SECRET_ENV]);
  if (auth === "missing") {
    return NextResponse.json(
      {
        error: `Falta ${CRON_SECRET_ENV} en el servidor: el cron está deshabilitado.`,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (auth === "unauthorized") {
    return NextResponse.json(
      { error: "Secreto inválido." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Falta RIOT_API_KEY en el servidor." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const startedAt = Date.now();
  const deadlineAt = startedAt + cronDeadlineMs();
  const budget = cronBudget();
  const batch = cronPlayers();

  let requests = 0;
  let retryAfterMs: number | undefined;
  const players: z.infer<typeof RoundResponse>["players"] = [];

  let pendingBefore = 0;
  try {
    pendingBefore = await countPendingPlayers();
  } catch (error) {
    // La base no contesta: es un 500 real, no una tanda vacía.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "La base no responde." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    while (Date.now() < deadlineAt && requests < budget) {
      const queue = await listPendingPlayers(batch);
      if (queue.length === 0) break;

      let advanced = false;

      for (const player of queue) {
        if (Date.now() >= deadlineAt || requests >= budget) break;

        const slice = cronPlayerSlice(budget - requests);
        const label = `${player.gameName ?? player.puuid.slice(0, 8)}${player.tagLine ? `#${player.tagLine}` : ""}`;

        try {
          const result = await syncPuuid(player.puuid, player.platform, {
            budget: slice,
            maxPages: 3,
            gameName: player.gameName ?? undefined,
            tagLine: player.tagLine ?? undefined,
            deadlineAt,
          });

          requests += result.requests;
          // Un jugador sin requests (lock ajeno o 429) no cuenta como avance.
          if (result.requests > 0) advanced = true;

          players.push({
            label,
            platform: player.platform,
            detailed: result.progress.detailed,
            known: result.progress.known,
            requests: result.requests,
            phase: result.phase,
            done: result.done,
            skipped: result.skipped,
          });

          if (result.retryAfterMs) {
            retryAfterMs = result.retryAfterMs;
            break;
          }
        } catch (error) {
          // Un jugador que falla no tumba la tanda: se anota y se sigue con el
          // siguiente (la cola lo vuelve a tomar en la próxima vuelta).
          players.push({
            label,
            platform: player.platform,
            detailed: 0,
            known: 0,
            requests: 0,
            phase: "error",
            done: false,
            skipped: false,
            error: error instanceof Error ? error.message : "error desconocido",
          });
          advanced = true;

          // Riot rechaza para siempre a algunos de estos (puuid de otra región,
          // cuenta borrada): sin esto volvería a ser el primero de la cola en
          // cada tanda y se comería un request cada 5 minutos. Se lo manda al
          // final y sigue el siguiente.
          await touchSyncState(player.puuid, player.platform, {
            lastSyncedAt: Date.now(),
          }).catch(() => {});
        }
      }

      if (retryAfterMs !== undefined) break;
      // Nada avanzó en la vuelta entera (todos con lock o sin requests): cortar
      // evita quedarse girando sobre la misma cola hasta el deadline.
      if (!advanced) break;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "La tanda falló.",
        players,
        requests,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  let pendingAfter = pendingBefore;
  try {
    pendingAfter = await countPendingPlayers();
  } catch {
    // Si falla el conteo final, la tanda ya está hecha: no se pierde nada.
  }

  const body = RoundResponse.parse({
    ok: true,
    elapsedMs: Date.now() - startedAt,
    requests,
    pendingBefore,
    pendingAfter,
    ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
    players,
  } satisfies z.infer<typeof RoundResponse>);

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}

export const GET = run;
export const POST = run;
