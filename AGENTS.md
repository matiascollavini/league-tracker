# AGENTS.md — Instrucciones permanentes del proyecto

> Este archivo contiene las instrucciones generales y permanentes del operador.
> Se lee al inicio de cada sesión. No hace falta volver a pedirlas: están acá.
> Última actualización: 2026-11-24

---

## 1. Contexto del proyecto

**league-page**: sitio web público de estadísticas de League of Legends.

Funcionalidad objetivo (v1):

1. Buscar por **Riot ID** (`nombreDeInvocador#TAG`, formato Riot ID desde 2023).
2. Mostrar las **últimas 20 partidas** del invocador.
3. Mostrar el **campeón más jugado en las partidas analizadas** de la cuenta
   (máx. ~1.000 recuperables por la API; ver ADR-002 — no se puede "toda la cuenta").
4. Mostrar el **winrate con ese campeón**.
5. Permitir **filtrar por campeón**: partidas jugadas y winrate de ese campeón.

La v1 es una base: se van a agregar más features después, así que el diseño debe
ser extensible (capa de datos desacoplada, endpoints/caché reutilizables, tipos claros).

Prioridades: **gratuito o casi gratuito**, datos oficiales cuando existan, bajo riesgo
de rate-limit, buena performance y buen DX para un solo desarrollador.

---

## 2. Instrucciones permanentes del operador

### 2.1 Idioma
- Responder y documentar en **español**. Los nombres técnicos (endpoints, campos,
  librerías, comandos) se dejan en inglés tal cual.

### 2.2 Investigar antes de decidir
- Ante cualquier decisión técnica relevante (API, framework, base de datos, hosting),
  **primero investigar y presentar opciones comparadas**, después recomendar.
- Mostrar: qué es, requisitos (key, registro, cuenta), límites del plan gratuito,
  riesgos (ToS, rate limits, dependencia de terceros) y veredicto en una línea.
- Citar siempre las **fuentes primarias** (URLs oficiales) y la fecha de la info.
- Si algo no se pudo verificar, marcarlo explícitamente como `UNVERIFIED`.
  **Nunca inventar endpoints, parámetros, límites ni campos de respuesta.**

### 2.3 Usar agentes para la investigación
- Delegar investigación web a `web-research` (Exa + crawl4ai) y usar el resto de los
  agentes cuando aporten algo concreto: `researcher`, `scout` (recon de código),
  `reviewer` (revisión), `oracle` (decisiones de arquitectura), `worker` (implementación),
  `evidence-auditor` (verificar que un documento esté respaldado por sus fuentes).
- Paralelizar cuando las tareas sean independientes; no duplicar agentes con el mismo
  alcance. El padre conserva la decisión final y la escritura de los entregables caros.
- Ojo con `evidence-auditor` en esta máquina: no tiene tools web (`web_search`,
  `fetch_content`) y falla al pedirlas. Para auditar hechos, usar `web-research`
  o correr los `curl` a mano con bash y guardar la evidencia en el documento.

### 2.4 Documentar cada API usada
- Toda API externa que se integre debe quedar documentada **a fondo** en un `.txt`
  dentro de `docs/`, con: registro/keys, límites, endpoints, esquemas de respuesta,
  ejemplos de request/response, códigos de error, políticas de uso y recetas
  de código. Ese archivo es la referencia de trabajo, no un resumen.
- Mantener `docs/DECISIONES.md` con las decisiones técnicas y su justificación.

### 2.5 Datos y rate limits (regla dura)
- Nunca hacer fan-out de N requests al upstream por cada page view. Todo dato
  externo pasa por **caché compartida del servidor** (y capa de agregados por jugador).
- Respetar los límites publicados del proveedor; manejar `429` + `Retry-After`.
- Secretos (API keys) van en `.env.local` / variables de entorno del deploy.
  Nunca en el repo, nunca hardcodeados, nunca enviados al cliente.

### 2.6 Calidad de código
- TypeScript estricto; sin `any` injustificado.
- Validar respuestas externas en el borde (zod o similar) y degradar con un estado de
  error visible, no con un crash de la página.
- Commits chicos y con mensaje en español (imperativo: "agrega", "corrige", "refactoriza").
- Verificar antes de dar por terminado: `typecheck` + `lint` + `build` + probar la
  feature en el navegador (o con un script) contra la API real.

### 2.7 Forma de trabajo
- Antes de refactors grandes: proponer el plan y esperar confirmación.
- No agregar dependencias pesadas sin justificar la alternativa nativa.
- Si un requisito es ambiguo y afecta la arquitectura, preguntar antes de construir.

---

## 3. Stack decidido

_(Detalle y justificación en `docs/DECISIONES.md`.)_

| Capa | Elección | Estado |
| --- | --- | --- |
| Fuente de datos | **Riot Games API oficial** + **Data Dragon** (`docs/API-LOL.txt`) | decidido |
| Framework | **Next.js 16.4 App Router** (`cacheComponents: true`) | decidido |
| UI | Tailwind 4 + shadcn/ui (gráficos: Recharts v3) | decidido |
| Hosting | Vercel Hobby (escape hatch: Fly.io) | decidido |
| Caché caliente | `fetch` de Next (sin Redis: la DB hace de caché y de lock) | decidido |
| Persistencia | **SQLite** local / **Turso** free en prod (ADR-007) | implementado |
| Ingest | `npm run ingest` + `npm run worker` (cola con cursor) + cron en Actions | implementado |
| Estado del código | v1 funcionando con **datos reales** (dev key en `.env.local`) | implementado |

### Regla de producto derivada del ADR-002
El historial de Riot está topado en **~1.000 partidas por jugador** (2 años de
retención), y no existe endpoint de "partidas totales". Por eso:
- La feature es "campeón más jugado en las N partidas analizadas", no "en toda la cuenta".
- La UI **siempre** muestra cuántas partidas se analizaron y el rango de fechas.
- Nuestra DB acumula historia propia desde el día 1.

---

## 4. Mapa del repositorio

```
src/app/        páginas (landing, perfil, legales)
src/components/ UI server-first + buscador (client)
src/lib/riot/   capa de datos: config, http, account, matches, aggregate, types
docs/           API-LOL.txt (referencia de la API), DECISIONES.md (ADRs)
research/       briefs crudos de investigación + crawled/ (fuentes)
workflows/      scripts de orquestación de subagentes
scripts/        verify-riot.mjs (verificación contra la API real)
```

---

## 6. Estado actual y próximo paso

- Investigación: **cerrada** (APIs, límites, framework, arquitectura).
- Código: **v1 implementada** — landing + buscador, perfil con últimas partidas,
  agregado por campeón, filtros por campeón y por cola, páginas legales.
  Corre en modo demo sin key (`npm run dev`).
- Datos reales: **verificado** el 2026-11-24 (`npm run verify:riot`). La dev key
  se vence cada 24 h: si aparece 401/403, regenerarla en el portal.
- Regla dura: `account-v1` y `match-v5` van al host **regional**; `summoner`,
  `league` y `mastery` al host de **plataforma**. El tipo `RiotTarget` lo hace
  imposible de confundir.
- Los nombres visibles de campeones salen de **Data Dragon** (`catalog.all`),
  no de Riot: Riot manda el id interno (`Kaisa`, `Nunu`, `MonkeyKing`).
- Siguiente (pendientes acordados, no perder de vista):
  1. **Deploy**: crear cuenta gratis en Turso + Vercel (paso a paso en
     `docs/DEPLOY.md`) y pedir la production key de Riot.
  2. Más UI: gráficos (winrate por campeón, evolución temporal).

---

## 5. Historial

- 2026-11: creación del proyecto. Se asientan estas instrucciones y arranca la
  investigación de APIs de LoL + framework. (Patch vigente al momento: 16.23.1.)
  Resultado: ADR-001..005 en `docs/DECISIONES.md` + `docs/API-LOL.txt` v1.1
  (auditada y corregida el mismo día).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
