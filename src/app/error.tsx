"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold text-gold-200">
        Algo se rompió de nuestro lado
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        No pudimos renderizar la página. Si persiste, puede ser un cambio en la
        API de Riot o una partida con datos inesperados.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-muted/60">
          digest: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-gold-400"
      >
        Reintentar
      </button>
    </div>
  );
}
