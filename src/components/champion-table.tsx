"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState, type ChangeEvent } from "react";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";
import { searchChampions } from "@/lib/champion-search";
import { cn } from "@/lib/utils";

/**
 * Fila de la tabla "Por campeón", ya resuelta en el servidor.
 *
 * El componente es cliente (tiene buscador), así que todo lo que necesita va
 * como dato plano: nada de funciones `hrefFor` ni imports de la capa de Riot
 * (eso arrastraría `fetch`, `process.env` y el catálogo al bundle).
 */
export type ChampionRow = {
  /** `championName` de Riot (`Kaisa`, `Nunu`...). */
  championName: string;
  /** Nombre localizado de Data Dragon ("Kai'Sa"). */
  name: string;
  /** Ícono ya armado en el servidor. */
  iconUrl: string;
  games: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winrate: number;
  /** Link que filtra las partidas por este campeón. */
  href: string;
};

type Props = {
  rows: ChampionRow[];
  /** Nombres de TODOS los campeones del catálogo, para distinguir "no lo jugó" de "no existe". */
  catalogNames: string[];
  selected?: string;
  totalMatches: number;
  /** Link que quita el filtro de campeón. */
  clearHref: string;
  showAll: boolean;
  allHref: string;
  lessHref: string;
};

/** Como op.gg: top 8 por defecto, salvo que pidan "ver todos". */
const LIMIT = 8;

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** "A", "A y B", "A, B y C", "A, B, C y 2 más". */
function formatNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} y ${names[2]}`;
  return `${names.slice(0, 3).join(", ")} y ${names.length - 3} más`;
}

/**
 * Tabla por campeón al estilo dpm: filas compactas con arte de 32px, partidas
 * jugadas y el winrate a la derecha. Arriba tiene un buscador que filtra sobre
 * los campeones **ya jugados** en esta selección; si el campeón existe en
 * Data Dragon pero no aparece en las partidas analizadas, lo dice explícito.
 */
export function ChampionTable({
  rows,
  catalogNames,
  selected,
  totalMatches,
  clearHref,
  showAll,
  allHref,
  lessHref,
}: Props) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;

  // Con búsqueda activa se mira la lista completa, no solo las 8 visibles. Si el
  // campeón existe en Data Dragon pero no se jugó nunca, `notPlayed` lo delata.
  const { matches, notPlayed } = useMemo(
    () => searchChampions(rows, catalogNames, query),
    [catalogNames, query, rows],
  );

  if (rows.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[13px] text-muted">
        No hay partidas para agregar en esta selección.
      </p>
    );
  }

  let list = matches;
  if (!searching) {
    list = showAll ? rows : rows.slice(0, LIMIT);
    if (!showAll && selected) {
      const selectedRow = rows.find((row) => row.championName === selected);
      if (selectedRow && !list.includes(selectedRow)) {
        list = [...list, selectedRow];
      }
    }
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <div>
      <div className="px-3 pb-2">
        <div className="flex h-7 items-center gap-1.5 rounded-md border border-line/70 bg-soft/40 pl-2 pr-1 transition-colors focus-within:border-primary/40 focus-within:bg-soft/60">
          <Search className="size-3.5 shrink-0 text-dim" aria-hidden />
          <label htmlFor={inputId} className="sr-only">
            Buscar un campeón en la tabla
          </label>
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={onChange}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            aria-describedby={list.length === 0 ? messageId : undefined}
            placeholder="Buscar campeón…"
            className="h-full min-w-0 flex-1 bg-transparent text-[11px] font-medium text-fg outline-none placeholder:font-normal placeholder:text-dim"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="grid size-5 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-soft hover:text-fg"
              aria-label="Limpiar búsqueda de campeón"
            >
              <X className="size-3" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_4.25rem] items-center gap-2 px-3 pb-1.5">
        <span className="label">Campeón</span>
        <span className="label text-right">PJ</span>
        <span className="label text-right">WR</span>
      </div>

      {list.length === 0 ? (
        <div id={messageId} role="status" className="px-3 py-6 text-center">
          {notPlayed.length > 0 ? (
            <>
              <p className="text-[13px] font-semibold text-fg">
                Todavía no jugó con {formatNames(notPlayed)}.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                No aparece en las {totalMatches} partidas analizadas de esta
                selección.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-fg">
                No se encuentran campeones disponibles con ese nombre.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Fijate cómo se escribe o probá con otro campeón.
              </p>
            </>
          )}
        </div>
      ) : (
        <ul>
          {list.map((champion) => {
            const isSelected = champion.championName === selected;
            const good = champion.winrate >= 0.5;
            return (
              <li key={champion.championName}>
                <Link
                  href={isSelected ? clearHref : champion.href}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_2.5rem_4.25rem] items-center gap-2 px-3 py-1.5 transition-colors hover:bg-soft/40",
                    isSelected && "bg-primary/8",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Image
                      src={champion.iconUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 shrink-0 rounded-sm bg-soft object-cover"
                    />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[13px] font-semibold text-fg">
                        {champion.name}
                      </span>
                      <span className="tabular block text-[10px] font-medium text-muted">
                        {champion.wins}V {champion.losses}D
                        {totalMatches > 0
                          ? ` · ${Math.round((champion.games / totalMatches) * 100)}% de lo jugado`
                          : ""}
                      </span>
                    </span>
                  </span>

                  <span className="tabular text-right text-[12px] font-bold text-fg">
                    {champion.games}
                  </span>

                  <span className="text-right leading-tight">
                    <span
                      className={cn(
                        "tabular block text-[13px] font-semibold",
                        good ? "text-gold-soft" : "text-orange/80",
                      )}
                    >
                      {percent(champion.winrate)}
                    </span>
                    <span
                      className="mt-0.5 block h-1 overflow-hidden rounded-full bg-soft"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          good ? "bg-gold-soft" : "bg-orange/80",
                        )}
                        style={{
                          width: `${Math.max(3, Math.round(champion.winrate * 100))}%`,
                        }}
                      />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!searching && rows.length > LIMIT ? (
        <div className="mt-2 px-3">
          <Link
            href={showAll ? lessHref : allHref}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {showAll ? "Ver menos" : `Ver los ${rows.length} campeones`}
          </Link>
        </div>
      ) : null}

      {selected ? (
        <div className="mt-2 px-3 pb-1">
          <Link
            href={clearHref}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-fg"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Quitar filtro de campeón
          </Link>
        </div>
      ) : !searching ? (
        <p className="mt-2 flex items-center gap-1 px-3 pb-1 text-[11px] text-muted">
          Tocá un campeón para filtrar tus partidas
          <ChevronRight className="size-3" aria-hidden />
        </p>
      ) : null}
    </div>
  );
}
