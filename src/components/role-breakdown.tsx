import Link from "next/link";
import { percent } from "@/lib/riot/aggregate";
import type { RoleFilterId, RoleStat } from "@/lib/riot/roles";
import { cn } from "@/lib/utils";

/**
 * Reparto de partidas por rol, del más jugado al menos jugado. Cada fila es un
 * filtro: al presionarla el perfil se recorta a ese rol (se combina con la cola
 * y con el campeón), y al volver a presionarla se quita.
 *
 * Es un server component: los links se arman en el server (el componente no
 * sabe de plataformas ni de Riot IDs) y acá no hay estado propio.
 */
export function RoleBreakdown({
  stats,
  selected,
  total,
  hrefFor,
  className,
}: {
  stats: RoleStat[];
  selected?: RoleFilterId | null;
  /** Partidas del alcance actual, para el ancho de la barra de reparto. */
  total: number;
  /** `undefined` = sin filtro de rol (todos). */
  hrefFor: (role?: RoleFilterId) => string;
  className?: string;
}) {
  if (stats.length === 0) return null;

  return (
    <section className={cn("panel px-3 py-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="section-title">Roles</h2>
        <span className="shrink-0 text-[10px] font-medium text-dim">
          {stats.length === 1 ? "1 rol" : `${stats.length} roles`}
        </span>
      </div>

      <ul className="mt-1.5 space-y-0.5">
        {stats.map((stat) => {
          const active = stat.role === selected;
          const good = stat.winrate >= 0.5;
          const share = total > 0 ? stat.games / total : 0;

          return (
            <li key={stat.role}>
              <Link
                href={hrefFor(active ? undefined : stat.role)}
                aria-current={active ? "true" : undefined}
                title={`${active ? "Quitar el filtro de " : "Ver solo "}${stat.label.toLowerCase()}`}
                className={cn(
                  "group flex items-center gap-2 rounded-[4px] px-1.5 py-1 transition-colors hover:bg-soft/50",
                  active && "bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "w-[52px] shrink-0 truncate text-[11.5px] font-semibold leading-tight",
                    active ? "text-primary" : "text-fg",
                  )}
                >
                  {stat.label}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/8">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        good ? "bg-win/70" : "bg-loss/60",
                      )}
                      style={{ width: `${Math.max(share * 100, 2)}%` }}
                    />
                  </span>
                  <span className="tabular mt-1 block text-[10px] font-medium leading-tight text-muted">
                    {stat.games} {stat.games === 1 ? "partida" : "partidas"} ·{" "}
                    {stat.wins}V {stat.losses}D
                  </span>
                </span>

                <span
                  className={cn(
                    "tabular shrink-0 text-[11px] font-bold",
                    good ? "text-gold-soft" : "text-orange/80",
                  )}
                >
                  {percent(stat.winrate)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <Link
          href={hrefFor()}
          className="mt-2 inline-block text-[10px] font-semibold text-muted transition-colors hover:text-primary"
        >
          Ver todos los roles
        </Link>
      ) : null}
    </section>
  );
}
