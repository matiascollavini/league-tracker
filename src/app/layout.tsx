import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { HeaderSearch } from "@/components/header-search";
import { platformFromEnv } from "@/lib/riot/config";
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
    default: "League Tracker · estadísticas de League of Legends",
    template: "%s · League Tracker",
  },
  description:
    "Buscá tu Riot ID y mirá tus últimas partidas, tu campeón más jugado y su winrate.",
};

const NAV = [
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
          <div className="mx-auto flex h-14 w-full max-w-[1202px] items-center gap-3 px-4 sm:gap-5">
            <Link href="/" className="group flex shrink-0 items-center gap-2">
              <Image
                src="/logo.png"
                alt="League Tracker"
                width={32}
                height={32}
                priority
                className="size-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-105"
              />
              <span className="hidden text-[15px] font-extrabold tracking-tight text-fg sm:inline">
                League<span className="text-primary">Tracker</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-0.5 text-[13px] font-semibold text-muted md:flex">
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

            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
              {/* Buscador directo: las sugerencias salen del índice propio, no de Riot. */}
              <HeaderSearch
                defaultPlatform={platformFromEnv()}
                className="w-full max-w-[300px] md:w-64 lg:w-80"
              />

              <span className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-soft/50 px-2 py-1 text-[11px] font-semibold text-muted lg:inline-flex">
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
              League Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t
              reflect the views or opinions of Riot Games or anyone officially
              involved in producing or managing Riot Games properties. Riot
              Games, and all associated properties are trademarks or registered
              trademarks of Riot Games, Inc.
            </p>
            <p>
              Datos obtenidos de la API oficial de Riot Games. Este sitio no
              está afiliado ni patrocinado por Riot Games.{" "}
              <Link
                href="/comparar"
                className="underline decoration-line hover:text-muted"
              >
                Comparar
              </Link>{" "}
              ·{" "}
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
