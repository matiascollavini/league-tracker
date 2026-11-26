import Link from "next/link";
import { percent } from "@/lib/riot/aggregate";
import { NO_ROLE, type RoleFilterId, type RoleStat } from "@/lib/riot/roles";
import { cn } from "@/lib/utils";

/**
 * Reparto de partidas por rol, del más jugado al menos jugado. Cada fila es un
 * filtro: al presionarla el perfil se recorta a ese rol (se combina con la cola
 * y con el campeón), y al volver a presionarla se quita.
 *
 * La estética es la del "Role performance" de dpm.lol (ADR-025): **la fila
 * entera es la barra**. El fondo `primary/12` crece según las partidas del rol
 * sobre el total del alcance (no sobre el rol más jugado), así los roles se
 * comparan entre sí. A la izquierda, icono + nombre + partidas; a la derecha,
 * winrate y V-D con el formato y los colores del resto del perfil (`percent` +
 * oro/naranja).
 *
 * Solo se listan las cinco posiciones: las partidas sin rol (ARAM, Arena,
 * custom) no son relevantes para el reparto y tampoco entran en el denominador
 * de la barra, así las filas suman 100% entre ellas. El filtro `?role=none`
 * sigue existiendo por URL, pero el panel no lo ofrece.
 *
 * Es un server component: los links se arman en el server (el componente no
 * sabe de plataformas ni de Riot IDs) y acá no hay estado propio.
 */
export function RoleBreakdown({
  stats,
  selected,
  hrefFor,
  className,
}: {
  stats: RoleStat[];
  selected?: RoleFilterId | null;
  /** `undefined` = sin filtro de rol (todos). */
  hrefFor: (role?: RoleFilterId) => string;
  className?: string;
}) {
  const roles = stats.filter((stat) => stat.role !== NO_ROLE);
  if (roles.length === 0) return null;

  // La barra se mide contra el total de las cinco posiciones, no contra el
  // máximo: la suma de las filas da 100%. Se calcula acá (y no con un prop)
  // para que nunca se desincronice del agregado.
  const total = roles.reduce((sum, stat) => sum + stat.games, 0);

  return (
    <section className={cn("panel overflow-hidden", className)}>
      <div className="flex items-baseline justify-between gap-2 px-3 pb-1.5 pt-3">
        <h2 className="section-title">Roles</h2>
        <span className="shrink-0 text-[10px] font-medium text-dim">
          {roles.length === 1 ? "1 rol" : `${roles.length} roles`}
        </span>
      </div>

      <ul>
        {roles.map((stat) => {
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
                  "group relative flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-soft/40",
                  active &&
                    "bg-primary/10 shadow-[inset_2px_0_0_var(--color-primary)]",
                )}
              >
                {/* La barra: ancho = % de partidas del rol sobre el total. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0",
                    active ? "bg-primary/20" : "bg-primary/12",
                  )}
                  style={{ width: `${share * 100}%` }}
                />

                <RoleIcon
                  role={stat.role}
                  className={cn(
                    "relative size-5 shrink-0",
                    active
                      ? "text-primary"
                      : "text-muted group-hover:text-fg/80",
                  )}
                />

                <span className="relative min-w-0 flex-1 leading-tight">
                  <span
                    className={cn(
                      "block truncate text-[13px] font-semibold",
                      active ? "text-primary" : "text-fg",
                    )}
                  >
                    {stat.label}
                  </span>
                  <span className="tabular block text-[11px] font-medium text-muted">
                    {stat.games} {stat.games === 1 ? "partida" : "partidas"}
                  </span>
                </span>

                <span className="relative whitespace-nowrap text-right leading-tight">
                  <span
                    className={cn(
                      "tabular block text-[13px] font-semibold",
                      good ? "text-gold-soft" : "text-orange/80",
                    )}
                  >
                    {percent(stat.winrate)}{" "}
                    <span className="text-[11px] font-semibold opacity-70">
                      WR
                    </span>
                  </span>
                  <span className="tabular block text-[11px] font-medium text-muted">
                    {stat.wins}V - {stat.losses}D
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <Link
          href={hrefFor()}
          className="flex items-center justify-center border-t border-line-soft bg-soft/40 py-2 text-[11px] font-extrabold uppercase tracking-wider text-muted transition-colors hover:bg-soft/70 hover:text-fg"
        >
          Ver todos los roles
        </Link>
      ) : null}
    </section>
  );
}

/**
 * Iconos de posición de Riot (Community Dragon, `position-*.svg`), inline y
 * monocromos con `currentColor`. El segundo path es la sombra del icono, al 40%
 * como en el cliente. "Sin rol" (ARAM, Arena, custom) no tiene icono propio en
 * el juego: se dibuja un círculo con una raya.
 */
function RoleIcon({
  role,
  className,
}: {
  role: RoleFilterId;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 34 34"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      {role === "TOP" ? (
        <>
          <path
            opacity="0.4"
            fillRule="evenodd"
            d="M21,14H14v7h7V14Zm5-3V26L11.014,26l-4,4H30V7.016Z"
          />
          <path d="M4 4 4.003 28.045 9 23 9 9 23 9 28.045 4.003 4 4Z" />
        </>
      ) : role === "JUNGLE" ? (
        <path
          fillRule="evenodd"
          d="M25,3c-2.128,3.3-5.147,6.851-6.966,11.469A42.373,42.373,0,0,1,20,20a27.7,27.7,0,0,1,1-3C21,12.023,22.856,8.277,25,3ZM13,20c-1.488-4.487-4.76-6.966-9-9,3.868,3.136,4.422,7.52,5,12l3.743,3.312C14.215,27.917,16.527,30.451,17,31c4.555-9.445-3.366-20.8-8-28C11.67,9.573,13.717,13.342,13,20Zm8,5a15.271,15.271,0,0,1,0,2l4-4c0.578-4.48,1.132-8.864,5-12C24.712,13.537,22.134,18.854,21,25Z"
        />
      ) : role === "MIDDLE" ? (
        <>
          <path
            opacity="0.4"
            fillRule="evenodd"
            d="M30,12.968l-4.008,4L26,26H17l-4,4H30ZM16.979,8L21,4H4V20.977L8,17,8,8h8.981Z"
          />
          <path d="M25 4 4 25 4 30 9 30 30 9 30 4 25 4Z" />
        </>
      ) : role === "BOTTOM" ? (
        <>
          <path
            opacity="0.4"
            fillRule="evenodd"
            d="M13,20h7V13H13v7ZM4,4V26.984l3.955-4L8,8,22.986,8l4-4H4Z"
          />
          <path d="M29.997 5.955 25 11 25 25 11 25 5.955 29.997 30 30 29.997 5.955Z" />
        </>
      ) : role === "UTILITY" ? (
        <path
          fillRule="evenodd"
          d="M26,13c3.535,0,8-4,8-4H23l-3,3,2,7,5-2-3-4h2ZM22,5L20.827,3H13.062L12,5l5,6Zm-5,9-1-1L13,28l4,3,4-3L18,13ZM11,9H0s4.465,4,8,4h2L7,17l5,2,2-7Z"
        />
      ) : (
        <>
          <circle
            cx="17"
            cy="17"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.4"
          />
          <path d="M11 17h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
