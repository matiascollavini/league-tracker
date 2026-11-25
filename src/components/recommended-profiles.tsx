"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Swords } from "lucide-react";
import { PLATFORM_LABEL } from "@/lib/riot/config";
import { fetchRecommended } from "@/lib/recommended";
import type { RecommendedHit } from "@/lib/search";

/**
 * Sección "Perfiles recomendados" de la landing (abajo del primer scroll).
 *
 * Sales del mismo endpoint que el desplegable del buscador, así que la request
 * es una sola por visita. Son cuentas del índice propio ordenadas por cantidad
 * de partidas guardadas: no es un ranking de habilidad, es "acá hay datos".
 */
export function RecommendedProfiles() {
  const [items, setItems] = useState<RecommendedHit[] | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchRecommended().then((hits) => {
      if (alive) setItems(hits);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Sin datos (base vacía o error) la sección no ocupa lugar.
  if (items !== null && items.length === 0) return null;

  return (
    <section className="panel px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="section-title">Perfiles recomendados</h2>
        <span className="text-[10.5px] text-dim">
          Cuentas con más partidas analizadas
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items === null
          ? Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-[58px] animate-pulse rounded-md border border-line-soft bg-soft/40"
                aria-hidden
              />
            ))
          : items.slice(0, 6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-md border border-line-soft bg-soft/25 px-3 py-2.5 transition-colors hover:border-white/15 hover:bg-soft/60"
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-shade text-[13px] font-extrabold text-primary">
                  {item.iconUrl ? (
                    <Image
                      src={item.iconUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-full object-cover"
                    />
                  ) : (
                    item.gameName.slice(0, 1).toUpperCase()
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-fg">
                    {item.gameName}
                    <span className="text-dim">#{item.tagLine}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-dim">
                    <span>
                      {PLATFORM_LABEL[item.platform].split(" · ")[0] ?? item.platform}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Swords className="size-2.5" aria-hidden />
                      {item.games.toLocaleString("es-AR")} partidas
                    </span>
                  </span>
                </span>

                <ChevronRight
                  className="size-3.5 shrink-0 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            ))}
      </div>
    </section>
  );
}
