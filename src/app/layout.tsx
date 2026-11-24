import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// dpm.lol usa Plus Jakarta Sans (200–800). La variable la consume globals.css.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "league-page · estadísticas de League of Legends",
    template: "%s · league-page",
  },
  description:
    "Buscá tu Riot ID y mirá tus últimas partidas, tu campeón más jugado y su winrate.",
};

const NAV = [
  { href: "/", label: "Buscar" },
  { href: "/comparar", label: "Comparar" },
  { href: "/legal/privacidad", label: "Privacidad" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-deep/92 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-[1202px] items-center gap-5 px-4">
            <Link href="/" className="group flex shrink-0 items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-extrabold text-bg">
                L
              </span>
              <span className="text-[15px] font-extrabold tracking-tight text-fg">
                league<span className="text-primary">page</span>
              </span>
            </Link>

            <nav className="flex items-center gap-0.5 text-[13px] font-semibold text-muted">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-soft/70 hover:text-fg"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-soft/50 px-2 py-1 text-[11px] font-semibold text-muted sm:inline-flex">
                <span
                  className="size-1.5 rounded-full bg-win"
                  aria-hidden="true"
                />
                API oficial de Riot
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1202px] flex-1 px-4 py-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-white/5 bg-deep/60 px-4 py-8">
          <div className="mx-auto max-w-[1202px] space-y-3 text-[11px] leading-relaxed text-dim">
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
                className="underline decoration-line hover:text-muted"
              >
                Términos
              </Link>{" "}
              ·{" "}
              <Link
                href="/legal/privacidad"
                className="underline decoration-line hover:text-muted"
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
