"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Platform } from "@/lib/riot/config";
import {
  formatGameClock,
  liveClockSeconds,
  MAX_LIVE_SECONDS,
} from "@/lib/live";

/** Cada cuánto se le vuelve a preguntar a Riot si la partida sigue viva. */
const POLL_MS = 45_000;

type LiveBadgeProps = {
  /** Puuid con el que Riot reconoció la partida (el perfil puede tener alias). */
  puuid: string;
  /** Plataforma del jugador: el endpoint de spectator es de plataforma. */
  platform: Platform;
  /** Epoch ms del inicio. null si Riot lo omitió (partida recién creada). */
  startedAt: number | null;
  /** Segundos que calculó el server al renderizar: base del conteo. */
  base: number | null;
  /** Etiqueta de la cola ("Solo/Duo", "Flex"...), ya resuelta en el server. */
  queueLabel: string | null;
  /** Campeón del jugador, con la URL del icono ya armada. */
  champion: { name: string; iconUrl: string } | null;
};

/**
 * Chip "en partida ahora" del perfil (SPECTATOR-V5).
 *
 * El contador avanza solo: `gameStartTime` es un epoch, así que el navegador
 * calcula los segundos localmente cada segundo (`liveClockSeconds`).
 *
 * El **estado** (sigue o no en partida) se revalida cada 45 s con
 * `/api/en-vivo`: una página abierta no se re-renderiza sola, así que sin este
 * poll el chip se quedaba pegado después de que la partida terminaba. El
 * endpoint reusa la caché de 30 s de SPECTATOR-V5, así que N espectadores de la
 * misma partida no multiplican los requests a Riot. Cuando Riot devuelve 404
 * (partida terminada), el chip desaparece.
 *
 * La primera pasada en el cliente es idéntica a la del server (`base`), así que
 * no hay mismatch de hidratación; recién en el tick siguiente el valor se
 * recalcula con la hora del navegador.
 */
export function LiveBadge({
  puuid,
  platform,
  startedAt,
  base,
  queueLabel,
  champion,
}: LiveBadgeProps) {
  const [seconds, setSeconds] = useState<number | null>(base);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;
    const mountedAt = Date.now();
    const id = setInterval(() => {
      const next = liveClockSeconds({
        startedAt,
        base,
        mountedAt,
        now: Date.now(),
      });
      setSeconds(next);
      // Pasado el máximo razonable el dato ya no sirve: se deja de contar.
      if (next !== null && next > MAX_LIVE_SECONDS) {
        clearInterval(id);
        setEnded(true);
      }
    }, 1_000);
    return () => clearInterval(id);
  }, [startedAt, base, ended]);

  // Revalidación periódica del estado: el reloj no alcanza, la partida puede
  // haber terminado. Si Riot ya no la ve (404), el chip se va.
  useEffect(() => {
    if (ended) return;
    let cancelled = false;
    const controller = new AbortController();

    async function check() {
      // Pestaña en segundo plano: no gastamos requests por un chip que nadie ve.
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const params = new URLSearchParams({ platform, puuid });
        const res = await fetch(`/api/en-vivo?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { live?: boolean | null };
        if (!cancelled && data.live === false) setEnded(true);
      } catch {
        // Red/429: se reintenta en el próximo tick; no ocultamos el chip.
      }
    }

    const id = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      controller.abort();
    };
  }, [platform, puuid, ended]);

  // Partida irreal (o el perfil quedó abierto toda la tarde): sin chip.
  if (ended) return null;
  if (seconds !== null && seconds > MAX_LIVE_SECONDS) return null;

  const clock = formatGameClock(seconds);
  const description = [
    "En partida ahora",
    queueLabel,
    clock ? `minuto ${clock}` : null,
    champion?.name ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border border-win/25 bg-win/10 py-0.5 pl-1.5 pr-2"
      title={description}
    >
      <span className="relative flex size-1.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-win opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-win" />
      </span>

      <span className="text-[10px] font-bold uppercase leading-none tracking-wide text-win">
        En partida
      </span>

      {queueLabel ? (
        <span className="text-[10px] font-semibold leading-none text-muted">
          {queueLabel}
        </span>
      ) : null}

      {clock ? (
        <span className="tabular text-[10px] font-bold leading-none text-fg">
          {clock}
        </span>
      ) : null}

      {champion ? (
        <span className="flex items-center gap-1">
          <Image
            src={champion.iconUrl}
            alt=""
            width={16}
            height={16}
            className="size-4 rounded-[2px]"
          />
          <span className="text-[10px] font-semibold leading-none text-fg">
            {champion.name}
          </span>
        </span>
      ) : null}
    </span>
  );
}
