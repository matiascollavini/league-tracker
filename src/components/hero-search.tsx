"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ArrowRight, ChevronDown, Loader2, Search, Sparkles, X } from "lucide-react";
import {
  isPlatform,
  PLATFORM_OPTIONS,
  PLATFORM_LABEL,
  type Platform,
} from "@/lib/riot/config";
import { profileHref } from "@/lib/links";
import {
  MIN_QUERY_LENGTH,
  parseRiotId,
  SearchResponseSchema,
  type RecommendedHit,
  type SearchHit,
} from "@/lib/search";
import { fetchRecommended } from "@/lib/recommended";
import { cn } from "@/lib/utils";

/**
 * Buscador grande de la landing (estilo Apple: una sola píldora centrada).
 *
 * Es más que un formulario: al enfocarlo (o al escribir) despliega un panel con
 * **perfiles recomendados** —las cuentas del índice propio con más partidas—
 * y, apenas hay 2 caracteres, las sugerencias de `/api/buscar`. Ninguna de las
 * dos cosas sale a Riot (ADR-014): el perfil resuelve el Riot ID recién cuando
 * entrás. Enter con `Nombre#TAG` es el camino directo.
 */

const DEBOUNCE_MS = 180;
const LAST_PLATFORM_KEY = "lt:platform";
/** Cuántos recomendados entran en el desplegable (el resto, en la sección de abajo). */
const SHOWN_RECOMMENDED = 6;

/** Fila del panel: recomendación o sugerencia, ya normalizada para pintar. */
type Item = {
  key: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
  iconUrl: string | null;
  level: number | null;
  games: number | null;
  href: string;
};

type Snapshot = {
  key: string;
  results: SearchHit[];
  failed: boolean;
};

const fromHit = (hit: SearchHit | RecommendedHit): Item => ({
  key: hit.href,
  gameName: hit.gameName,
  tagLine: hit.tagLine,
  platform: hit.platform,
  iconUrl: hit.iconUrl,
  level: hit.level,
  games: "games" in hit ? hit.games : null,
  href: hit.href,
});

/** Región corta para el `<select>` de la píldora: "LAS", "EUW", "KR"… */
const shortRegion = (platform: Platform): string =>
  PLATFORM_LABEL[platform].split(" · ")[0] ?? platform.toUpperCase();

export function HeroSearch({ defaultPlatform }: { defaultPlatform: Platform }) {
  const router = useRouter();
  const inputId = useId();
  const listId = `${inputId}-list`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [recommended, setRecommended] = useState<RecommendedHit[] | null>(null);
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
  const [platform, setPlatform] = useState<Platform>(
    remembered ?? defaultPlatform,
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Cache por consulta: volver a escribir la misma palabra no re-pide la API. */
  const cache = useRef(new Map<string, SearchHit[]>());

  const trimmed = query.trim();
  const key = trimmed.toLowerCase();
  const typing = trimmed.length >= MIN_QUERY_LENGTH;
  const showPanel = open;

  // Estado derivado: no espejamos la respuesta en más `useState`.
  const current = snapshot && snapshot.key === key ? snapshot : null;
  const results = current?.results ?? [];
  const status = !typing
    ? "idle"
    : current
      ? current.failed
        ? "error"
        : "ready"
      : "loading";

  /**
   * Lo que se ve en el panel: recomendados mientras no hay consulta,
   * sugerencias apenas se escribe.
   */
  const items: Item[] = typing
    ? results.map(fromHit)
    : (recommended ?? []).slice(0, SHOWN_RECOMMENDED).map(fromHit);

  const activeIndex = active >= 0 && active < items.length ? active : -1;

  /** Recomendados: una request por carga de página (compartida con la sección). */
  useEffect(() => {
    let alive = true;
    void fetchRecommended().then((hits) => {
      if (alive) setRecommended(hits);
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Debounce + abort: una request por pausa de tecleo, no por tecla. */
  useEffect(() => {
    const value = query.trim();
    if (value.length < MIN_QUERY_LENGTH) return;

    const queryKey = value.toLowerCase();
    const cached = cache.current.get(queryKey);
    const controller = new AbortController();

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
      const typingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      const isSlash = event.key === "/" && !typingTarget;
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

  /** Enter: fila elegida > Riot ID exacto > primera sugerencia. */
  function submit() {
    const picked = activeIndex >= 0 ? items[activeIndex] : undefined;
    if (picked) {
      go(picked.href);
      return;
    }

    const parsed = parseRiotId(query);
    if (parsed.ok) {
      // La región elegida en la píldora manda para los Riot ID a mano.
      go(profileHref(platform, parsed.value.gameName, parsed.value.tagLine));
      return;
    }

    const first = typing ? items[0] : undefined;
    if (first) {
      go(first.href);
      return;
    }

    setError(
      trimmed.includes("#")
        ? parsed.error
        : "Escribí el Riot ID completo, con el tag (Nombre#TAG).",
    );
    setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((value) => (value + 1) % items.length);
      return;
    }
    if (event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((value) => (value <= 0 ? items.length - 1 : value - 1));
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
    <div ref={rootRef} className="relative">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "flex h-14 items-center gap-2 rounded-full border border-white/10 bg-card/70 pl-4 pr-2 backdrop-blur-xl sm:pl-5",
          "shadow-[0_20px_60px_-26px_rgba(0,0,0,0.95)] transition-all duration-200",
          "focus-within:border-primary/40 focus-within:bg-card/90",
          "focus-within:shadow-[0_24px_70px_-28px_rgba(200,170,110,0.45)]",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Buscar un Riot ID
        </label>

        <Search className="size-[18px] shrink-0 text-dim" aria-hidden />

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
          onFocus={() => setOpen(true)}
          placeholder="Buscá tu Riot ID — Nombre#TAG"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium text-fg outline-none placeholder:font-normal placeholder:text-dim sm:text-base"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setError(null);
              setActive(-1);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="grid size-6 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-soft hover:text-fg"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}

        <span className="h-6 w-px shrink-0 bg-white/10" aria-hidden />

        <label className="relative flex shrink-0 items-center">
          <span className="sr-only">Región</span>
          <select
            value={platform}
            onChange={(event) => {
              if (isPlatform(event.target.value)) setPlatform(event.target.value);
              inputRef.current?.focus();
            }}
            className="appearance-none bg-transparent py-1 pl-1 pr-5 text-[11px] font-bold uppercase tracking-wide text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {shortRegion(option.value)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-0.5 size-3 text-dim"
            aria-hidden
          />
        </label>

        <button
          type="submit"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-deep transition-[background-color,transform] hover:bg-primary/90 active:scale-95"
          aria-label="Buscar"
        >
          <ArrowRight className="size-[18px]" aria-hidden />
        </button>
      </form>

      {showPanel ? (
        <div className="absolute inset-x-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-[0_28px_70px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-dim">
            {typing ? (
              "Cuentas indexadas"
            ) : (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Sparkles className="size-3" aria-hidden />
                Perfiles recomendados
              </span>
            )}
          </div>

          <div
            id={listId}
            role="listbox"
            aria-label={typing ? "Sugerencias" : "Perfiles recomendados"}
            className="max-h-[min(58vh,340px)] overflow-y-auto px-2 pb-1"
          >
            {status === "error" ? (
              <p className="px-2 py-2.5 text-[12px] text-loss">
                No se pudo buscar. Probá de nuevo en un momento.
              </p>
            ) : status === "loading" && items.length === 0 ? (
              <p className="px-2 py-2.5 text-[12px] text-dim">Buscando…</p>
            ) : !typing && recommended === null ? (
              <p className="inline-flex items-center gap-2 px-2 py-2.5 text-[12px] text-dim">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Cargando recomendados…
              </p>
            ) : items.length === 0 ? (
              <p className="px-2 py-2.5 text-[12px] leading-relaxed text-dim">
                {typing
                  ? "Ninguna cuenta indexada con ese nombre todavía."
                  : "Todavía no hay cuentas en el índice."}{" "}
                {parsed.ok ? (
                  <>
                    Enter te lleva a{" "}
                    <span className="font-semibold text-muted">
                      {parsed.value.gameName}#{parsed.value.tagLine}
                    </span>{" "}
                    (se resuelve contra Riot).
                  </>
                ) : (
                  <>Escribí Nombre#TAG y Enter para buscarla en Riot.</>
                )}
              </p>
            ) : (
              items.map((item, index) => (
                <button
                  key={item.key}
                  id={`${listId}-${index}`}
                  role="option"
                  type="button"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                    index === activeIndex ? "bg-soft" : "hover:bg-soft/70",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-soft text-[13px] font-extrabold text-primary">
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
                    <span className="block truncate text-[14px] font-semibold text-fg">
                      {item.gameName}
                      <span className="text-dim">#{item.tagLine}</span>
                    </span>
                    <span className="block truncate text-[11px] text-dim">
                      {shortRegion(item.platform)}
                      {item.games !== null
                        ? ` · ${item.games.toLocaleString("es-AR")} partidas`
                        : item.level
                          ? ` · Nv. ${item.level}`
                          : ""}
                    </span>
                  </span>

                  <ArrowRight className="size-4 shrink-0 text-dim" aria-hidden />
                </button>
              ))
            )}
          </div>

          <div className="border-t border-white/5 bg-deep/50 px-4 py-2 text-[10.5px] leading-4 text-dim">
            {error ? (
              <span className="text-loss">{error}</span>
            ) : parsed.ok ? (
              <span>
                Enter: ir a{" "}
                <span className="font-semibold text-muted">
                  {parsed.value.gameName}#{parsed.value.tagLine}
                </span>{" "}
                en {shortRegion(platform)}
              </span>
            ) : (
              <span>
                {typing
                  ? "Sugerencias de cuentas ya indexadas."
                  : "Cuentas con más partidas en el índice."}{" "}
                También podés escribir Nombre#TAG y Enter.
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
