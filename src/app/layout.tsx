import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "league-page · estadísticas de League of Legends",
    template: "%s · league-page",
  },
  description:
    "Buscá tu Riot ID y mirá tus últimas partidas, tu campeón más jugado y su winrate.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 border-b border-line/80 bg-ink-950/85 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link href="/" className="group flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-gold-500 font-bold text-ink-950">
                L
              </span>
              <span className="text-sm font-semibold tracking-wide text-gold-300 group-hover:text-gold-200">
                league<span className="text-gold-500">page</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-xs text-muted">
              <Link href="/" className="hover:text-gold-300">
                Buscar
              </Link>
              <Link href="/legal/privacidad" className="hover:text-gold-300">
                Privacidad
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
          {children}
        </main>

        <footer className="border-t border-line/80 px-4 py-8">
          <div className="mx-auto max-w-5xl space-y-3 text-xs leading-relaxed text-muted">
            <p>
              league-page isn&apos;t endorsed by Riot Games and doesn&apos;t
              reflect the views or opinions of Riot Games or anyone officially
              involved in producing or managing Riot Games properties. Riot
              Games, and all associated properties are trademarks or registered
              trademarks of Riot Games, Inc.
            </p>
            <p>
              Datos obtenidos de la API oficial de Riot Games. Este sitio no
              está afiliado ni patrocinado por Riot Games.{" "}
              <Link
                href="/legal/terminos"
                className="underline decoration-line hover:text-gold-400"
              >
                Términos
              </Link>{" "}
              ·{" "}
              <Link
                href="/legal/privacidad"
                className="underline decoration-line hover:text-gold-400"
              >
                Privacidad
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
