"use client";

import { useId, useMemo, useState } from "react";
import { formatDate } from "@/lib/riot/aggregate";
import {
  ladderLabel,
  lpDomain,
  TIER_HEX,
  type RankPoint,
} from "@/lib/riot/rank-history";
import { cn } from "@/lib/utils";

/**
 * Gráfico de historial de LP de una cola (ADR-026).
 *
 * Es SVG nativo, sin librería de gráficos: son ~50 líneas de dibujo y una
 * interacción (leer el punto bajo el cursor). Recharts queda para gráficos
 * grandes que de verdad lo necesiten.
 *
 * Recibe la serie ya normalizada a LP absoluto desde el server. El pie del
 * gráfico es el "tooltip": al pasar el mouse se lee el punto; si no, el saldo
 * de LP desde la primera medición.
 */

type Props = {
  points: RankPoint[];
  /** Cola, para el texto accesible ("Solo/Duo"). */
  queueLabel: string;
  className?: string;
};

/** Altura del área de dibujo, en píxeles. */
const H = 56;
/** Coordenadas internas del SVG (el ancho se estira con el contenedor). */
const VB_W = 320;
const VB_H = 100;

const PRIMARY = "#c8aa6e";

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function RankChart({ points, queueLabel, className }: Props) {
  const gradientId = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);

  const domain = useMemo(() => lpDomain(points), [points]);

  const geometry = useMemo(() => {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (!firstPoint || !lastPoint) return null;
    const span = lastPoint.ts - firstPoint.ts;
    if (span <= 0) return null;

    const x = (ts: number) => ((ts - firstPoint.ts) / span) * VB_W;
    const y = (lp: number) => {
      const ratio = (lp - domain.lo) / (domain.hi - domain.lo);
      return VB_H - Math.min(1, Math.max(0, ratio)) * VB_H;
    };

    const coords = points.map((point) => ({
      x: x(point.ts),
      y: y(point.lp),
      percent: ((point.ts - firstPoint.ts) / span) * 100,
    }));
    const line = coords
      .map((c, index) => `${index === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
      .join(" ");
    const area = `${line} L${VB_W} ${VB_H} L0 ${VB_H} Z`;

    return { coords, line, area };
  }, [points, domain]);

  const first = points[0];
  const last = points[points.length - 1];

  if (!first || !last || !geometry) {
    return (
      <div className={cn("mt-2 rounded border border-line/70 bg-soft/30 px-2 py-1.5", className)}>
        <p className="text-[10px] leading-snug text-dim">
          {first
            ? `Primera medición: ${formatDate(first.ts)}. El gráfico se completa con las próximas visitas al perfil.`
            : "Todavía no hay historial de rango: se guarda una foto cada vez que alguien abre este perfil."}
        </p>
      </div>
    );
  }

  const delta = last.lp - first.lp;
  const lastCoord = geometry.coords[geometry.coords.length - 1];
  if (!lastCoord) return null;
  const color = TIER_HEX[last.tier] ?? PRIMARY;
  const activePoint = active === null ? null : (points[active] ?? null);
  const activeDelta =
    active !== null && active > 0
      ? (points[active]?.lp ?? 0) - (points[active - 1]?.lp ?? 0)
      : null;

  const summary = `Historial de LP de ${queueLabel}: ${first.label} (${formatDate(first.ts)}) a ${last.label} (${formatDate(last.ts)}).`;

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    geometry.coords.forEach((coord, index) => {
      const distance = Math.abs(coord.percent / 100 - ratio);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    setActive(best);
  };

  return (
    <div className={cn("mt-2", className)} role="img" aria-label={summary}>
      <div className="flex gap-1">
        {/* Grilla de LP: cada línea cae en una división real. */}
        <div className="relative w-11 shrink-0" style={{ height: H }}>
          {domain.ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 whitespace-nowrap text-[8px] leading-none text-dim"
              style={{
                top: `${((domain.hi - tick) / (domain.hi - domain.lo)) * 100}%`,
              }}
            >
              {ladderLabel(tick)}
            </span>
          ))}
        </div>

        <div
          className="relative flex-1"
          style={{ height: H, touchAction: "pan-y" }}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(event) => {
            // En touch el dedo se va enseguida: se deja la lectura puesta.
            if (event.pointerType !== "touch") setActive(null);
          }}
          onPointerCancel={() => setActive(null)}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            {domain.ticks.map((tick) => {
              const y =
                ((domain.hi - tick) / (domain.hi - domain.lo)) * VB_H;
              return (
                <line
                  key={tick}
                  x1={0}
                  x2={VB_W}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-fg/10"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            <path d={geometry.area} fill={`url(#${gradientId})`} />
            <path
              d={geometry.line}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Último dato medido: siempre visible. */}
          <span
            aria-hidden
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
            style={{
              left: `${lastCoord.percent}%`,
              top: `${(lastCoord.y / VB_H) * 100}%`,
              backgroundColor: color,
            }}
          />

          {active !== null && geometry.coords[active] ? (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-fg/25"
                style={{ left: `${geometry.coords[active].percent}%` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
                style={{
                  left: `${geometry.coords[active].percent}%`,
                  top: `${(geometry.coords[active].y / VB_H) * 100}%`,
                  backgroundColor: TIER_HEX[points[active]?.tier ?? ""] ?? PRIMARY,
                }}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Lectura: punto bajo el cursor o saldo desde la primera medición. */}
      <div className="mt-1 flex items-baseline justify-between gap-2 text-[10px] leading-none">
        {activePoint ? (
          <>
            <span className="truncate font-semibold text-fg">
              {activePoint.label}
              {activeDelta !== null && activeDelta !== 0 ? (
                <span
                  className={cn(
                    "tabular ml-1 font-bold",
                    activeDelta > 0 ? "text-win" : "text-loss",
                  )}
                >
                  {signed(activeDelta)}
                </span>
              ) : null}
            </span>
            <span className="tabular shrink-0 text-dim">
              {formatDate(activePoint.ts)}
            </span>
          </>
        ) : (
          <>
            <span
              className={cn(
                "tabular font-semibold",
                delta > 0 ? "text-win" : delta < 0 ? "text-loss" : "text-muted",
              )}
            >
              {signed(delta)} LP
            </span>
            <span className="text-dim">desde el {formatDate(first.ts)}</span>
          </>
        )}
      </div>
    </div>
  );
}
