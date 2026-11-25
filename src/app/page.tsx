import Link from "next/link";
import { ArrowLeftRight, Swords, Trophy, UserSearch } from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { RecommendedProfiles } from "@/components/recommended-profiles";
import { Card } from "@/components/ui/card";
import { isMockMode } from "@/lib/riot/http";
import { platformFromEnv } from "@/lib/riot/config";

export default function HomePage() {
  const demo = isMockMode();

  return (
    <div>
      {/*
        Primera pantalla: SOLO el título y el buscador (estilo Apple).
        `-mt-6/-mt-8` cancelan el padding de <main> y la altura descuenta el
        header (h-14), así el hero ocupa exactamente un viewport y el resto de
        la página aparece recién al scrollear. `svh` evita el salto de la barra
        del navegador en mobile.
      */}
      <section className="-mt-6 flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-1 pb-10 sm:-mt-8">
        <h1 className="max-w-3xl text-balance text-center text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] text-fg sm:text-[62px]">
          Tus estadísticas de League of Legends,
          <span className="block text-primary">sin humo.</span>
        </h1>

        <div className="mt-8 w-full max-w-xl sm:mt-10">
          <HeroSearch defaultPlatform={platformFromEnv()} />
        </div>
      </section>

      <div className="space-y-4">
        {demo ? (
          <p className="rounded-md border border-gold/20 bg-gold/8 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
            <strong className="font-bold text-gold">Modo demo.</strong> No hay{" "}
            <code className="font-mono text-[11px] text-fg">RIOT_API_KEY</code>{" "}
            configurada, así que la app muestra una cuenta de ejemplo. Cargá la
            key en{" "}
            <code className="font-mono text-[11px] text-fg">.env.local</code> y
            reiniciá el server para ver datos reales.
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<UserSearch className="size-3.5" />}
            title="Buscá por Riot ID"
            body="Nombre#TAG, el mismo que usás en el cliente. Elegís la región y listo."
          />
          <Feature
            icon={<Swords className="size-3.5" />}
            title="Últimas 20 partidas"
            body="Resultado, KDA, campeón, rol, cola y duración de cada partida."
          />
          <Feature
            icon={<Trophy className="size-3.5" />}
            title="Tu campeón de verdad"
            body="Agregado por campeón sobre todas las partidas analizadas, con winrate y filtro."
          />
        </section>

        <RecommendedProfiles />

        <section className="panel px-4 py-3.5">
          <h2 className="section-title">Sobre los datos</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Los números salen de la API oficial de Riot. Riot limita el historial
            recuperable a las últimas <strong className="text-fg">~1.000</strong>{" "}
            partidas de cada cuenta (2 años de retención), así que el agregado por
            campeón se calcula sobre las partidas analizadas y la página siempre
            te dice cuántas fueron. Las partidas custom se excluyen.
          </p>
        </section>

        <p>
          <Link
            href="/comparar"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-primary"
          >
            <ArrowLeftRight className="size-3" aria-hidden />
            O compará dos jugadores
          </Link>
        </p>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="px-4 py-3.5">
      <div className="mb-2 inline-flex size-7 items-center justify-center rounded border border-white/10 bg-soft/60 text-primary">
        {icon}
      </div>
      <h3 className="section-title">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{body}</p>
    </Card>
  );
}
