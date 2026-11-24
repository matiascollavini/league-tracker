import Link from "next/link";
import { ArrowLeftRight, Swords, Trophy, UserSearch } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { Card } from "@/components/ui/card";
import { isMockMode } from "@/lib/riot/http";
import { platformFromEnv } from "@/lib/riot/config";

export default function HomePage() {
  const demo = isMockMode();

  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden">
        <div className="bg-primary/4 px-5 py-10 sm:px-10 sm:py-14">
          <p className="inline-flex items-center gap-2 rounded border border-white/10 bg-soft/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <span className="size-1.5 rounded-full bg-win" aria-hidden />
            Datos oficiales de Riot Games
          </p>

          <h1 className="mt-4 max-w-3xl text-balance text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-fg sm:text-[44px]">
            Tus estadísticas de League of Legends,
            <span className="text-primary"> sin humo.</span>
          </h1>

          <p className="mt-3 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted sm:text-[15px]">
            Buscá tu Riot ID y mirá tus últimas partidas, tu campeón más jugado
            y su winrate. Todo calculado sobre tus partidas reales.
          </p>

          <div className="mt-6 max-w-2xl">
            <SearchForm defaultPlatform={platformFromEnv()} />
          </div>

          <p className="mt-4">
            <Link
              href="/comparar"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-primary"
            >
              <ArrowLeftRight className="size-3" aria-hidden />
              O compará dos jugadores
            </Link>
          </p>

          {demo ? (
            <p className="mt-5 max-w-2xl rounded-md border border-gold/20 bg-gold/8 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              <strong className="font-bold text-gold">Modo demo.</strong> No hay{" "}
              <code className="font-mono text-[11px] text-fg">
                RIOT_API_KEY
              </code>{" "}
              configurada, así que la app muestra una cuenta de ejemplo. Cargá la
              key en{" "}
              <code className="font-mono text-[11px] text-fg">.env.local</code> y
              reiniciá el server para ver datos reales.
            </p>
          ) : null}
        </div>
      </section>

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
