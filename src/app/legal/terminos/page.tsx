import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos",
  description: "Condiciones de uso de league-page.",
};

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 text-[13px] leading-relaxed text-muted">
      <h1 className="text-[26px] font-extrabold tracking-tight text-fg">
        Términos de uso
      </h1>
      <p className="text-[11px] text-dim">
        Última actualización: 24 de noviembre de 2026.
      </p>

      <section className="space-y-2">
        <h2 className="section-title">Qué es esto</h2>
        <p>
          league-page es un proyecto independiente que muestra estadísticas
          públicas de League of Legends obtenidas de la API oficial de Riot
          Games. Es gratuito y no está afiliado, patrocinado ni avalado por Riot
          Games.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">
          Exactitud de los datos
        </h2>
        <p>
          Los datos vienen de Riot y se muestran &quot;tal cual&quot;. Riot limita
          el historial recuperable a las últimas ~1.000 partidas de cada cuenta,
          así que los agregados (campeón más jugado, winrate) se calculan sobre
          las partidas analizadas, no sobre la historia completa. La página indica
          siempre esa base.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Uso aceptable</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No automatizar consultas masivas contra el sitio.</li>
          <li>
            No usar los datos para acosar, doxear o perjudicar a otros jugadores.
          </li>
          <li>No revender ni redistribuir los datos como si fueran propios.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">
          Disponibilidad y responsabilidad
        </h2>
        <p>
          El servicio puede cambiar, romperse o discontinuarse sin aviso. No
          garantizamos disponibilidad ni exactitud, y no somos responsables de
          decisiones tomadas a partir de estas estadísticas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Propiedad</h2>
        <p>
          League of Legends, Riot Games y todas las propiedades asociadas son
          marcas registradas de Riot Games, Inc. Las imágenes de campeones se
          sirven desde Data Dragon, el CDN oficial de Riot.
        </p>
      </section>

      <p className="panel px-3 py-2.5 text-[11px] leading-relaxed">
        league-page isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the
        views or opinions of Riot Games or anyone officially involved in producing
        or managing Riot Games properties. Riot Games, and all associated
        properties are trademarks or registered trademarks of Riot Games, Inc.
      </p>
    </article>
  );
}
