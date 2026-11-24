import { Swords, Trophy, UserSearch } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { Card } from "@/components/ui/card";
import { isMockMode } from "@/lib/riot/http";
import { platformFromEnv } from "@/lib/riot/config";

export default function HomePage() {
  const demo = isMockMode();

  return (
    <div className="space-y-14">
      <section className="space-y-6 pt-6 text-center sm:pt-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-900/70 px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-hextech" aria-hidden />
          Datos oficiales de Riot Games
        </p>

        <h1 className="text-balance text-4xl font-semibold tracking-tight text-gold-200 sm:text-5xl">
          Tus estadísticas de League of Legends,
          <span className="text-gold-500"> sin humo.</span>
        </h1>

        <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          Buscá tu Riot ID y mirá tus últimas partidas, tu campeón más jugado y
          su winrate. Todo calculado sobre tus partidas reales.
        </p>

        <div className="mx-auto max-w-2xl">
          <SearchForm defaultPlatform={platformFromEnv()} />
        </div>

        {demo ? (
          <p className="mx-auto max-w-2xl rounded-lg border border-gold-600/40 bg-gold-600/10 px-4 py-3 text-xs leading-relaxed text-gold-300">
            <strong className="font-semibold">Modo demo.</strong> No hay{" "}
            <code className="text-gold-400">RIOT_API_KEY</code> configurada, así
            que la app muestra una cuenta de ejemplo. Cargá la key en{" "}
            <code className="text-gold-400">.env.local</code> y reiniciá el
            server para ver datos reales.
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Feature
          icon={<UserSearch className="size-4" />}
          title="Buscá por Riot ID"
          body="Nombre#TAG, el mismo que usás en el cliente. Elegís la región y listo."
        />
        <Feature
          icon={<Swords className="size-4" />}
          title="Últimas 20 partidas"
          body="Resultado, KDA, campeón, rol, cola y duración de cada partida."
        />
        <Feature
          icon={<Trophy className="size-4" />}
          title="Tu campeón de verdad"
          body="Agregado por campeón sobre todas las partidas analizadas, con winrate y filtro."
        />
      </section>

      <section className="rounded-xl border border-line bg-ink-900/60 p-5 text-sm leading-relaxed text-muted">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-400">
          Sobre los datos
        </h2>
        <p>
          Los números salen de la API oficial de Riot. Riot limita el historial
          recuperable a las últimas <strong>~1.000 partidas</strong> de cada
          cuenta (2 años de retención), así que el agregado por campeón se
          calcula sobre las partidas analizadas y la página siempre te dice
          cuántas fueron. Las partidas custom se excluyen.
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
    <Card className="p-5">
      <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg border border-line bg-ink-800 text-gold-500">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gold-300">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </Card>
  );
}
