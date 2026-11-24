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
      <h1 className="text-[22px] font-extrabold tracking-tight text-fg">
        Algo se rompió de nuestro lado
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        No pudimos renderizar la página. Si persiste, puede ser un cambio en la
        API de Riot o una partida con datos inesperados.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-dim">
          digest: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md border border-primary/20 bg-primary/12 px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        Reintentar
      </button>
    </div>
  );
}
