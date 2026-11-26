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
| UI | Tailwind 4 + shadcn/ui (gráficos: Recharts v3) · estética **dpm.lol** (ADR-011) | decidido |
| Hosting | Vercel Hobby (escape hatch: Fly.io) | decidido |
| Caché caliente | `fetch` de Next (sin Redis: la DB hace de caché y de lock) | decidido |
| Persistencia | **SQLite** local / **Turso** free en prod (ADR-007) | implementado |
| Ingest | `npm run ingest` + `npm run worker` (cola con cursor) + cron en Actions | implementado |
| Paridad dev/prod | `npm run db:pull` (Turso → `data/league.db`) | implementado |
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
src/app/api/    endpoints (health, sync, buscar, recomendados, en-vivo,
                partida/[matchId])
src/app/        páginas (landing, perfil, detalle de partida, legales)
src/components/ UI server-first + header-search y lista de partidas (client)
src/lib/riot/   capa de datos: config, http, account, matches, aggregate, panel, types
src/lib/db/     SQLite/Turso: client, matches, accounts (índice del buscador), teammates
docs/           API-LOL.txt (referencia de la API), DECISIONES.md (ADRs), DEPLOY.md
research/       briefs crudos de investigación + crawled/ (fuentes)
workflows/      scripts de orquestación de subagentes
scripts/        verify-riot, ingest, worker, db:copy (local→Turso), db:pull (Turso→local)
```

---

## 6. Estado actual y próximo paso

- Investigación: **cerrada** (APIs, límites, framework, arquitectura).
- Código: **v1 implementada** — landing + buscador, perfil con últimas partidas,
  agregado por campeón, filtros por campeón y por cola, páginas legales.
  Corre en modo demo sin key (`npm run dev`).
- Datos reales: **verificado** el 2026-11-24 (`npm run verify:riot`). La dev key
  se vence cada 24 h: si aparece 401/403, regenerarla en el portal.
- **Dev y prod leen bases distintas**: dev usa `data/league.db` (solo lo que se
  ingirió localmente) y producción usa **Turso** (lo que mantiene el worker).
  Por eso un mismo perfil puede mostrar otro pool, otra tabla "Por campeón" y
  otros picks. Para ver en dev lo mismo que en la web: `npm run db:pull`
  (Turso → local, sólo SELECT a prod, idempotente; credenciales en
  `.env.turso.local`). No apuntar dev a Turso: el sync on-demand escribe en la
  base.
- Regla dura: `account-v1` y `match-v5` van al host **regional**; `summoner`,
  `league` y `mastery` al host de **plataforma**. El tipo `RiotTarget` lo hace
  imposible de confundir.
- Los nombres visibles de campeones salen de **Data Dragon** (`catalog.all`),
  no de Riot: Riot manda el id interno (`Kaisa`, `Nunu`, `MonkeyKing`).
- Los tokens del tema (colores, radios, tipografía Plus Jakarta Sans) viven en
  `src/app/globals.css` y son **semánticos** (`bg`, `card`, `soft`, `line`, `fg`,
  `muted`, `primary`, `gold`, `win`, `loss`). No usar colores sueltos en componentes.
- Siguiente (pendientes acordados, no perder de vista):
  1. **Deploy**: crear cuenta gratis en Turso + Vercel (paso a paso en
     `docs/DEPLOY.md`) y pedir la production key de Riot.
  2. Más UI: gráficos (winrate por campeón, evolución temporal).

- El **buscador del header** (`HeaderSearch` → `GET /api/buscar`) sugiere cuentas
  del **índice propio** (`accounts`, esquema v5), no de Riot: `account-v1` no
  tiene búsqueda por nombre (ADR-014). Se alimenta con los 10 participantes de
  cada partida y con cada perfil visitado; el desplegable siempre ofrece ir al
  `Nombre#TAG` exacto, que sí resuelve contra Riot al abrir el perfil.

- La tabla **"Por campeón"** tiene un **buscador propio** (client component
  `src/components/champion-table.tsx` + lógica pura en `src/lib/champion-search.ts`).
  Filtra sobre los campeones ya jugados en la selección activa (ignora acentos y
  apóstrofes: "kaisa" = "Kai'Sa") y, si el nombre existe en Data Dragon pero el
  jugador nunca lo jugó, lo dice: "Todavía no jugó con X". Si no coincide con
  ningún campeón del catálogo: "No se encuentran campeones disponibles con ese
  nombre". Las filas se arman en el servidor (link e ícono incluidos) porque el
  componente es cliente y no puede recibir `hrefFor` ni importar la capa de Riot.

- La lista de "Últimas partidas" **no navega**: el click despliega el detalle de
  la partida en la misma página (ADR-012). El roster de los 10 jugadores se pide
  recién al abrir, a `GET /api/partida/[matchId]` (lee `match_participants`, no va
  a Riot). La ruta `/partida/[matchId]` sigue viva para compartir y para "forma
  reciente".

- Dentro del roster, el nombre de cada participante linkea a **su** perfil
  (`participantHref` en `src/lib/links.ts`). La plataforma sale del prefijo del
  `matchId` (`platformOfMatchId`: `LA2_…` → `la2`), que es la de los 10 jugadores;
  el dueño del perfil no se linkea a sí mismo para no perder los filtros. Sin
  Riot ID guardado (`riot_id` null) el nombre queda como texto, no como link roto.

- El perfil muestra un chip **"En partida"** si el jugador está jugando ahora
  (`src/lib/riot/spectator.ts` → SPECTATOR-V5, ADR-015 / ADR-020 /
  `docs/API-LOL.txt` §7.9). Es el único dato en tiempo real: se pide en el render
  con `revalidate: 30` y el tag `spectator`; `POST /api/sync` invalida el tag
  para que "Actualizar" no deje el chip pegado. El `404` es el caso normal (no
  está jugando) y cualquier error deja el perfil sin chip. Host de **plataforma**;
  solo cubre LoL (TFT tiene su propio endpoint).
- Debajo de "Forma reciente" el perfil muestra los **5 compañeros de equipo
  más frecuentes** (ADR-022): partidas juntos, V/D, winrate, icono y link a su
  perfil. Sale de `match_participants` en SQL (`getTopTeammates`), no de Riot;
  respeta el tab de cola y agrupa por Riot ID, no por puuid. En demo/vía directa
  se calcula del roster en memoria (`topTeammatesFromMatches`).
- El **reloj** avanza solo en el browser desde `gameStartTime` (`src/lib/live.ts`),
  sin requests. El **estado** sí se revalida: el chip consulta
  `GET /api/en-vivo?platform=&puuid=` cada 45 s (nada si la pestaña está oculta)
  y desaparece cuando Riot devuelve 404. Ese endpoint comparte la caché de 30 s,
  así que N espectadores de la misma partida no multiplican los requests a Riot.
  GitHub Actions no puede invalidar la Data Cache de Vercel: el poll es el que
  limpia una página ya abierta.

- El botón **"Actualizar" / "Actualizado"** vive en el hero del perfil
  (`src/components/refresh-button.tsx`, ADR-016/017). Llama a `POST /api/sync` en
  bucle hasta que no queden pendientes: el endpoint es incremental y resumible,
  así que sube solo las partidas que faltan. Al terminar hace `router.refresh()`
  y el perfil se redibuja solo. Sin contador fijo: si la tanda supera las 50
  partidas pendientes, aparece una barra con `X de Y analizadas · % · faltan N`
  y la fase actual (`buscando partidas`, `bajando detalles`, `rate limit`...);
  en tandas cortas solo se ve el botón (ADR-021).
- Ojo con el estado del botón (ADR-017 / ADR-018): `pending` y `done` solo
  miran **nuestra** cola, y una partida jugada después del último sync no está
  ni registrada. Por eso `checkNewestMatch()` (`src/lib/sync-status.ts`) compara
  contra Riot (1 request, `ids?count=1`, cache 45 s) y exige el link **del
  jugador** (`isMatchLoadedForPuuids`), no solo que la partida exista en
  `matches` (tabla compartida). La usan el render y `/api/sync`: el endpoint
  devuelve `upToDate` (`null` = no se pudo verificar).
- El cliente **solo** dice **"Actualizado"** con `upToDate === true`; una vuelta
  sin requests (lock, 429, deadline) no prueba nada y no cierra el loop. Si Riot
  no confirma, el botón vuelve a **"Actualizar"** con un aviso, no a un
  "Actualizado" falso (la vuelta anterior decía "Actualizado" y al recargar
  "Actualizar": ver ADR-018).
- La **home** es un hero de una pantalla con **solo** el título y un buscador
  centrado estilo Apple (`src/components/hero-search.tsx`, ADR-023); el resto
  (features, recomendados, "Sobre los datos") aparece al scrollear. En `/` el
  buscador del header se oculta (`hideOnHome`) para no tener dos campos en la
  misma pantalla. `HeroSearch` despliega recomendados con el input vacío y
  sugerencias de `/api/buscar` con ≥2 caracteres; Enter sin texto no navega.
  Los recomendados salen de `GET /api/recomendados` → `featuredAccounts()`
  (índice propio ordenado por partidas guardadas, no por habilidad) y el mapeo
  fila→hit vive en `src/lib/search-hits.ts` (lo comparten buscar y recomendados).

- Las tarjetas de **picks** del perfil (ADR-024) las resuelve
  `pickHighlights` (`src/lib/riot/aggregate.ts`), puro y en memoria:
  - **nunca menos de 5 partidas** para recomendar o desaconsejar un campeón;
  - **mejores**: mira los 8 más jugados, exige una muestra que escala con el
    volumen (10% del más jugado, tope 20) y ordena por cota inferior de Wilson
    (95%), no por WR crudo, así un 3/5 o un 2/3 no le gana a un 12/20; el WR que
    se muestra es el real;
  - **peores**: mira **todo el historial** (no el top de más jugados), exige
    `winrate <= 0.45` (el 45% entra) y ordena **por partidas jugadas** y, entre
    volúmenes parecidos, por peor WR (no por derrotas: un 1/6 no puede adelantar
    a un 4/9); se calculan primero, así un campeón de 45% o menos jamás sale
    como "mejor pick" (ahí la vara es `> 0.45`);
  - cada tarjeta muestra solo el título, las filas y un estado vacío que nombra
    el umbral (sin textos explicativos debajo: se sacaron a pedido del operador).
    Ojo: el piso relativo de `best` es el que puede tapar un campeón con pocas
    partidas; para `worst` el piso es fijo (5) y no hay pool que recorte.

- El perfil tiene un **filtro por rol** (ADR-025): el panel `RoleBreakdown`
  (`src/components/role-breakdown.tsx`) vive en la barra lateral, entre "Forma
  reciente" y "Compañeros frecuentes", con los roles ordenados **del más jugado
  al menos jugado** (partidas, V-D, WR y una barra de fondo con el % de partidas
  del rol sobre el total, estética "Role performance" de dpm: icono de posición
  y WR entero oro/naranja como el resto del perfil). Cada fila es un
  link: al presionarla el perfil se recorta a ese rol y **se combina con la cola
  y con el campeón** (`?role=TOP|JUNGLE|MIDDLE|BOTTOM|UTILITY|none`); al volver a
  presionarla se quita. `none` son las partidas sin posición (ARAM, Arena,
  custom) y **el panel no las muestra** (ni como fila ni en la barra), pero el
  filtro sigue válido por URL. La lógica pura está en `src/lib/riot/roles.ts` (`roleStats`,
  `matchesRoleFilter`, `isRoleFilter`) y no agrega ni un request: el rol recorta
  las filas que el perfil ya calcula, así que el pool, la tabla "Por campeón",
  los picks y los stats comparten el mismo alcance. El panel se calcula sobre la
  cola activa **sin** el filtro de rol (es el selector, tiene que mostrar los
  cinco). El viejo `RoleStrip` al pie de la tabla se eliminó.

- Las tarjetas de rango (**Solo/Duo** y **Flex**) muestran un **gráfico de LP en
  el tiempo** (ADR-026), como dpm. Riot **no tiene** endpoint de historial de
  rango ni LP por partida (`league-v4` es solo el estado actual; ver
  `research/rank-history-sources.md`), así que la serie son **fotos propias**:
  tabla `league_history` (esquema v6) con una fila por cambio de tier/división/LP,
  escrita cuando el perfil ya pide el rango (0 requests nuevos). El gráfico es
  `src/components/rank-chart.tsx` (SVG nativo, sin Recharts: es una línea de
  56 px) y la lógica pura está en `src/lib/riot/rank-history.ts` (LP absoluto:
  400 por tier, Maestro+ desde 2800). **Arranca el día que empezamos a mirar la
  cuenta**: las cuentas viejas muestran un solo punto hasta que se acumulen
  visitas; con 0/1 punto la UI lo dice en vez de dibujar una curva falsa.
  `mockLeagueHistory()` mantiene el modo demo con dos series de 120 días. El
  cron global de snapshots (1 request por cuenta/día) queda como pendiente.

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
