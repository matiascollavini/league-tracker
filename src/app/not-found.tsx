import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-primary/25">404</p>
      <h1 className="mt-3 text-[22px] font-extrabold tracking-tight text-fg">
        No encontramos esa cuenta
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Revisá el Riot ID y la región. El tag va después del # y cambia si el
        jugador se renombró (Riot permite un cambio cada 90 días).
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md border border-primary/20 bg-primary/12 px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        Volver al buscador
      </Link>
    </div>
  );
}
