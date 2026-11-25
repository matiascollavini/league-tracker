"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, Search, X } from "lucide-react";
import { isPlatform, PLATFORM_LABEL, type Platform } from "@/lib/riot/config";
import { profileHref } from "@/lib/links";
import {
  MIN_QUERY_LENGTH,
  parseRiotId,
  SearchResponseSchema,
  type SearchHit,
} from "@/lib/search";
import { cn } from "@/lib/utils";

/**
 * Buscador del header con sugerencias en vivo.
 *
 * Qué hace distinto de op.gg/u.gg/dpm: ellos tienen un índice de cuentas enorme;
 * nosotros solo podemos sugerir **cuentas ya indexadas** (los 10 participantes
 * de cada partida guardada + cada perfil visitado), porque Riot no tiene
 * búsqueda por nombre (ADR-014). Por eso el desplegable siempre ofrece, además
 * de las sugerencias, ir directo al Riot ID exacto escrito a mano.
 *
 * El endpoint `/api/buscar` nunca sale a Riot: si una cuenta no está indexada,
 * el perfil la resuelve contra Riot recién cuando entrás.
 */

const DEBOUNCE_MS = 180;
const LAST_PLATFORM_KEY = "lt:platform";

type Props = {
  defaultPlatform: Platform;
  className?: string;
};

/** Una respuesta ya parseada. `key` es la consulta en minúsculas que la originó. */
type Snapshot = {
  key: string;
  results: SearchHit[];
  failed: boolean;
};

export function HeaderSearch({ defaultPlatform, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const inputId = useId();
  const listId = `${inputId}-list`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [indexed, setIndexed] = useState<number | null>(null);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  /** Última región visitada; se lee una vez, en el cliente. */
  const [remembered] = useState<Platform | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(LAST_PLATFORM_KEY);
      return stored && isPlatform(stored) ? stored : null;
    } catch {
      return null;
    }
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Cache por consulta: volver a escribir la misma palabra no re-pide la API. */
  const cache = useRef(new Map<string, SearchHit[]>());

  const trimmed = query.trim();
  const key = trimmed.toLowerCase();
  const showPanel = open && trimmed.length >= MIN_QUERY_LENGTH;

  // Estado derivado: no hace falta espejar la respuesta en más `useState`.
  const current = snapshot && snapshot.key === key ? snapshot : null;
  const results = current?.results ?? [];
  const status = !showPanel
    ? "idle"
    : current
      ? current.failed
        ? "error"
        : "ready"
      : "loading";
  // Si la lista cambió y el índice activo quedó fuera de rango, se ignora.
  const activeIndex = active >= 0 && active < results.length ? active : -1;

  /** Región para los Riot ID escritos a mano: la del perfil abierto o la última. */
  const platformFromPath = pathname.split("/")[2] ?? "";
  const platform: Platform = isPlatform(platformFromPath)
    ? platformFromPath
    : (remembered ?? defaultPlatform);

  /** Recordar la región del último perfil visitado (escritura, sin re-render). */
  useEffect(() => {
    if (!isPlatform(platformFromPath)) return;
    try {
      window.localStorage.setItem(LAST_PLATFORM_KEY, platformFromPath);
    } catch {
      // Safari en modo privado: da igual, seguimos con la default.
    }
  }, [platformFromPath]);

  /** Debounce + abort: una request por pausa de tecleo, no por tecla. */
  useEffect(() => {
    const value = query.trim();
    if (value.length < MIN_QUERY_LENGTH) return;

    const queryKey = value.toLowerCase();
    const cached = cache.current.get(queryKey);
    const controller = new AbortController();

    // setState adentro del timer (no en el cuerpo del efecto): si no, React
    // encadena renders al pedo.
    const timer = setTimeout(
      () => {
        if (cached) {
          setSnapshot({ key: queryKey, results: cached, failed: false });
          return;
        }
        void (async () => {
          try {
            const response = await fetch(
              `/api/buscar?q=${encodeURIComponent(value)}`,
              { signal: controller.signal },
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = SearchResponseSchema.parse(await response.json());
            cache.current.set(queryKey, data.results);
            setSnapshot({ key: queryKey, results: data.results, failed: false });
            setIndexed(data.indexed);
          } catch {
            if (controller.signal.aborted) return;
            setSnapshot({ key: queryKey, results: [], failed: true });
          }
        })();
      },
      cached ? 0 : DEBOUNCE_MS,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /** Click afuera cierra el panel. */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /** Atajo de teclado: "/" o Ctrl/Cmd+K llevan el foco al buscador. */
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      const isSlash = event.key === "/" && !typing;
      const isCmdK =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!isSlash && !isCmdK) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setError(null);
      setActive(-1);
      router.push(href);
    },
    [router],
  );

  /** Enter: sugerencia elegida > Riot ID exacto > primera sugerencia. */
  function submit() {
    const picked = activeIndex >= 0 ? results[activeIndex] : undefined;
    if (picked) {
      go(picked.href);
      return;
    }

    const parsed = parseRiotId(query);
    if (parsed.ok) {
      go(profileHref(platform, parsed.value.gameName, parsed.value.tagLine));
      return;
    }

    const first = results[0];
    if (first) {
      go(first.href);
      return;
    }

    setError(
      trimmed.includes("#")
        ? parsed.error
        : "Escribí el Riot ID completo, con el tag (Nombre#TAG), o elegí una sugerencia.",
    );
    setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((value) => (value + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((value) => (value <= 0 ? results.length - 1 : value - 1));
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setError(null);
    setActive(-1);
    setOpen(true);
  }

  const parsed = parseRiotId(query);
  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar un Riot ID
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-dim"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (trimmed.length >= MIN_QUERY_LENGTH) setOpen(true);
          }}
          placeholder="Buscar Riot ID…"
          className="h-8 w-full rounded-md border border-white/10 bg-shade pl-8 pr-14 text-[12.5px] font-medium text-fg transition-colors placeholder:font-normal placeholder:text-dim hover:border-white/20 focus-visible:border-primary/60 focus-visible:outline-none"
        />

        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {status === "loading" ? (
            <Loader2 className="size-3.5 animate-spin text-dim" aria-hidden />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="grid size-5 place-items-center rounded text-dim transition-colors hover:bg-soft hover:text-fg"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3" aria-hidden />
            </button>
          ) : (
            <kbd className="hidden rounded border border-white/10 bg-soft/60 px-1 text-[9px] font-semibold leading-4 text-dim md:block">
              /
            </kbd>
          )}
        </div>
      </div>

      {showPanel ? (
        <div className="panel absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden shadow-[0_18px_40px_-12px_rgba(0,0,0,0.85)]">
          <div
            id={listId}
            role="listbox"
            aria-label="Cuentas"
            className="max-h-[min(60vh,320px)] overflow-y-auto p-1"
          >
            {status === "error" ? (
              <p className="px-2 py-2 text-[11px] text-loss">
                No se pudo buscar. Probá de nuevo en un momento.
              </p>
            ) : status === "loading" && results.length === 0 ? (
              <p className="px-2 py-2 text-[11px] text-dim">Buscando…</p>
            ) : results.length === 0 && status === "ready" ? (
              <p className="px-2 py-2 text-[11px] leading-relaxed text-dim">
                Ninguna cuenta indexada con ese nombre todavía.
                {parsed.ok ? (
                  <>
                    {" "}
                    Enter te lleva a{" "}
                    <span className="font-semibold text-muted">
                      {parsed.value.gameName}#{parsed.value.tagLine}
                    </span>{" "}
                    (se resuelve contra Riot).
                  </>
                ) : (
                  <> Escribí Nombre#TAG para buscarla en Riot.</>
                )}
              </p>
            ) : (
              results.map((hit, index) => (
                <button
                  key={hit.href}
                  id={`${listId}-${index}`}
                  role="option"
                  type="button"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hit.href)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors",
                    index === activeIndex ? "bg-soft" : "hover:bg-soft/70",
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded bg-soft text-[11px] font-extrabold text-primary">
                    {hit.iconUrl ? (
                      <Image
                        src={hit.iconUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="size-full object-cover"
                      />
                    ) : (
                      hit.gameName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-fg">
                      {hit.gameName}
                      <span className="text-dim">#{hit.tagLine}</span>
                    </span>
                    <span className="block truncate text-[10.5px] text-dim">
                      {PLATFORM_LABEL[hit.platform].split(" · ")[0]}
                      {hit.level ? ` · Nv. ${hit.level}` : ""}
                    </span>
                  </span>
                  <Search className="size-3 shrink-0 text-dim" aria-hidden />
                </button>
              ))
            )}
          </div>

          <div className="border-t border-white/5 bg-deep/60 px-2 py-1.5 text-[10px] leading-4 text-dim">
            {error ? (
              <span className="text-loss">{error}</span>
            ) : parsed.ok ? (
              <span>
                Enter: ir a{" "}
                <span className="font-semibold text-muted">
                  {parsed.value.gameName}#{parsed.value.tagLine}
                </span>{" "}
                en {PLATFORM_LABEL[platform].split(" · ")[0]}
              </span>
            ) : (
              <span>
                Sugerencias de cuentas ya indexadas
                {indexed ? ` (${indexed.toLocaleString("es-AR")})` : ""}.
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
