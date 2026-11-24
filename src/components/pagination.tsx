import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  /** URL de cada página; el componente no sabe de filtros. */
  hrefFor: (page: number) => string;
  className?: string;
};

const ITEM =
  "inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-[12px] font-semibold tabular transition-colors";

export function Pagination({ page, totalPages, hrefFor, className }: Props) {
  if (totalPages <= 1) return null;

  const previous = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="Paginación de partidas"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      <span className="text-[11px] font-medium text-muted">
        Página <strong className="font-bold text-fg">{page}</strong> de{" "}
        {totalPages}
      </span>

      <div className="flex flex-wrap items-center gap-1">
        {previous ? (
          <Link
            href={hrefFor(previous)}
            rel="prev"
            aria-label="Página anterior"
            className={cn(ITEM, "border-white/10 bg-soft/40 text-muted hover:border-white/20 hover:text-fg")}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Anterior</span>
          </Link>
        ) : (
          <span
            aria-hidden
            className={cn(ITEM, "border-white/5 text-dim/50")}
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </span>
        )}

        {pageItems(page, totalPages).map((item, index) =>
          item === null ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-[12px] text-dim"
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={hrefFor(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Página ${item}`}
              className={cn(
                ITEM,
                item === page
                  ? "border-primary/30 bg-primary/12 text-primary"
                  : "border-white/10 bg-soft/40 text-muted hover:border-white/20 hover:text-fg",
              )}
            >
              {item}
            </Link>
          ),
        )}

        {next ? (
          <Link
            href={hrefFor(next)}
            rel="next"
            aria-label="Página siguiente"
            className={cn(ITEM, "border-white/10 bg-soft/40 text-muted hover:border-white/20 hover:text-fg")}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <span
            aria-hidden
            className={cn(ITEM, "border-white/5 text-dim/50")}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}
