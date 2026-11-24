import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos usa league-page y cómo se tratan.",
};

export default function PrivacidadPage() {
  return (
    <article className="prose-invert mx-auto max-w-2xl space-y-6 text-[13px] leading-relaxed text-muted">
      <h1 className="text-[26px] font-extrabold tracking-tight text-fg">
        Política de privacidad
      </h1>
      <p className="text-[11px] text-dim">
        Última actualización: 24 de noviembre de 2026.
      </p>

      <section className="space-y-2">
        <h2 className="section-title">
          Qué datos tratamos
        </h2>
        <p>
          league-page no tiene cuentas de usuario ni formularios de registro. No
          pedimos email, contraseña ni datos de pago. Cuando buscás un Riot ID,
          procesamos ese identificador público (nombre, tag, región) y los datos
          de partidas que la API de Riot expone públicamente: campeón jugado,
          resultado, K/D/A, cola, duración y fecha.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">
          Para qué los usamos
        </h2>
        <p>
          Únicamente para calcular y mostrar las estadísticas que pediste
          (últimas partidas, campeón más jugado, winrate). No vendemos, alquilamos
          ni cedemos datos a terceros, y no los usamos para publicidad.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Con quién</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-semibold text-primary">Riot Games</strong>: origen de los
            datos, vía su API oficial.
          </li>
          <li>
            <strong className="font-semibold text-primary">Vercel</strong>: hosting y
            registros técnicos básicos.
          </li>
          <li>
            <strong className="font-semibold text-primary">Data Dragon</strong>: imágenes de
            campeones, servidas desde el CDN de Riot.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">
          Cuánto tiempo
        </h2>
        <p>
          Las respuestas de Riot se cachean como máximo unas horas en el
          servidor, y las partidas individuales (que son inmutables) pueden
          guardarse para no volver a pedirlas. No guardamos direcciones IP ni
          identificadores de navegador.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">
          Tus derechos
        </h2>
        <p>
          Podés pedir la eliminación de los datos asociados a tu Riot ID
          escribiendo a la dirección de contacto del proyecto (ver el repositorio).
          Riot Games también puede reenviarnos pedidos de borrado de usuarios
          finales, y los atendemos.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Cookies</h2>
        <p>
          No usamos cookies de publicidad ni de seguimiento. Si en el futuro
          agregamos analítica, se avisará en esta página.
        </p>
      </section>

      <p className="panel px-3 py-2.5 text-[11px] leading-relaxed">
        Este sitio no está avalado por Riot Games y no refleja las opiniones de
        Riot Games ni de nadie involucrado en producir o gestionar propiedades de
        Riot Games. League of Legends y Riot Games son marcas registradas de Riot
        Games, Inc.
      </p>
    </article>
  );
}
