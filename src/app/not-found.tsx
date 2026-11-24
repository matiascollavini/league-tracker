import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-6xl font-bold text-gold-600/40">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gold-200">
        No encontramos esa cuenta
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Revisá el Riot ID y la región. El tag va después del # y cambia si el
        jugador se renombró (Riot permite un cambio cada 90 días).
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-gold-400"
      >
        Volver al buscador
      </Link>
    </div>
  );
}
