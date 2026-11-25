import Image from "next/image";
import Link from "next/link";
import { profileIconUrl } from "@/lib/ddragon/champions";
import { isPlatform } from "@/lib/riot/config";
import { profileHref } from "@/lib/links";
import { percent } from "@/lib/riot/aggregate";
import type { TeammateStat } from "@/lib/riot/teammates";
import { cn } from "@/lib/utils";

/**
 * Los 5 compañeros de equipo más frecuentes del jugador (mismo equipo, no
 * rivales). Cada fila linkea al perfil del compañero cuando Riot nos dio su
 * Riot ID y la plataforma de las partidas; si no, queda como texto para no
 * dejar un link roto.
 */
export function FrequentTeammates({
  teammates,
  version,
  className,
}: {
  teammates: TeammateStat[];
  /** Versión de Data Dragon, para los iconos de invocador. */
  version: string;
  className?: string;
}) {
  return (
    <section className={cn("panel px-3 py-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="section-title">Compañeros frecuentes</h2>
        <span className="shrink-0 text-[10px] font-medium text-dim">
          mismo equipo
        </span>
      </div>

      {teammates.length === 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          Todavía no hay compañeros de equipo en las partidas analizadas.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-line/60">
          {teammates.map((teammate) => (
            <li key={teammate.puuid}>
              <TeammateRow teammate={teammate} version={version} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TeammateRow({
  teammate,
  version,
}: {
  teammate: TeammateStat;
  version: string;
}) {
  const platform = teammate.platform?.toLowerCase() ?? null;
  const href =
    platform &&
    isPlatform(platform) &&
    teammate.gameName &&
    teammate.tagLine
      ? profileHref(platform, teammate.gameName, teammate.tagLine)
      : null;

  const name = teammate.gameName ?? "Sin Riot ID";
  const body = (
    <>
      <span className="relative size-[26px] shrink-0 overflow-hidden rounded-[4px] bg-soft">
        {teammate.profileIcon ? (
          <Image
            src={profileIconUrl(version, teammate.profileIcon)}
            alt={`Icono de invocador de ${name}`}
            width={26}
            height={26}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-[11px] font-bold text-primary">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] font-semibold leading-tight text-fg">
          {name}
          {teammate.tagLine ? (
            <span className="font-medium text-dim">#{teammate.tagLine}</span>
          ) : null}
        </span>
        <span className="tabular mt-0.5 block text-[10px] font-medium leading-tight text-muted">
          {teammate.games} {teammate.games === 1 ? "partida" : "partidas"} ·{" "}
          {teammate.wins}V {teammate.losses}D
        </span>
      </span>

      <span
        className={cn(
          "tabular shrink-0 text-[11px] font-bold",
          teammate.winrate >= 0.5 ? "text-gold-soft" : "text-orange/80",
        )}
      >
        {percent(teammate.winrate)}
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-2 py-1.5">{body}</div>;
  }

  return (
    <Link
      href={href}
      title={`${name}${teammate.tagLine ? `#${teammate.tagLine}` : ""} · ${teammate.games} partidas juntos`}
      className="group flex items-center gap-2 py-1.5 transition-colors hover:text-fg"
    >
      {body}
    </Link>
  );
}
