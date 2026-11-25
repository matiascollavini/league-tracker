"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  formatGameClock,
  liveClockSeconds,
  MAX_LIVE_SECONDS,
} from "@/lib/live";

type LiveBadgeProps = {
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
 * El contador avanza solo, sin polling ni requests: `gameStartTime` es un epoch,
 * así que el navegador calcula los segundos localmente cada segundo
 * (`liveClockSeconds`). Cuando se cumple la ventana de caché del perfil, el
 * próximo render trae una foto nueva de Riot.
 *
 * La primera pasada en el cliente es idéntica a la del server (`base`), así que
 * no hay mismatch de hidratación; recién en el tick siguiente el valor se
 * recalcula con la hora del navegador.
 */
export function LiveBadge({
  startedAt,
  base,
  queueLabel,
  champion,
}: LiveBadgeProps) {
  const [seconds, setSeconds] = useState<number | null>(base);

  useEffect(() => {
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
      if (next !== null && next > MAX_LIVE_SECONDS) clearInterval(id);
    }, 1_000);
    return () => clearInterval(id);
  }, [startedAt, base]);

  // Partida irreal (o el perfil quedó abierto toda la tarde): sin chip.
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
