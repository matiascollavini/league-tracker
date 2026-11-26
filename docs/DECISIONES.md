# DECISIONES — league-page

Registro de decisiones técnicas (ADR liviano). Cada decisión: contexto → opciones
evaluadas → elección → consecuencias / cuándo revisarla.

Fecha de la investigación: **2026-11-24**. Fuentes crudas en `research/`.

---

## ADR-001 — Fuente de datos: Riot Games API oficial + Data Dragon

**Estado:** aceptada · **Fecha:** 2026-11-24

### Opciones evaluadas

| Fuente | ¿Oficial? | Costo | Key | Partidas | Stats por campeón | Veredicto |
|---|---|---|---|---|---|---|
| **Riot API** | ✅ | gratis (rate-limited) | `X-Riot-Token` | match-v5 ids + detalle | se calculan (trivial) | **CORE** |
| Data Dragon | ✅ | gratis, sin límite | no | — | id/nombre/icono/localización | **USAR** |
| CommunityDragon | ⚠️ espejo del cliente | gratis | no | — | assets extra | opcional |
| Meraki CDN | ⚠️ no oficial | gratis | no | — | meta global (`championrates`) | futuro |
| OP.GG | ⚠️ sitio | sin API pública | key interna por sesión | scrape | scrape | descartar |
| U.GG | ⚠️ sitio | sin API | — | scrape | scrape | descartar (Cloudflare + robots `/*?*`) |
| DeepLoL | ⚠️ sitio | sin API (`api.deeplol.gg` NXDOMAIN) | — | scrape | scrape | descartar |
| Mobalytics | ⚠️ sitio | solo widgets | — | — | — | descartar |
| LeagueOfGraphs | ⚠️ sitio | sin API | — | `Disallow: /api/*` | — | descartar |
| LoLalytics | ⚠️ sitio | sin API | — | scrape frágil | — | descartar |
| LoL Esports API | ✅ Riot | gratis, key pública | sí | solo pro play | — | futuro tab de esports |
| Leaguepedia Cargo | ⚠️ wiki | gratis | bot password | solo pro play | — | futuro |
| RapidAPI (proxies) | ❌ revendedores | pago por request | sí | varía | varía | descartar (política de reenvío) |

### Decisión
Riot API es **toda** la capa de datos, llamada solo desde el backend. Data Dragon
para estáticos. Cero dependencias de terceros.

### Consecuencias
- Todas las keys son gratis; el recurso escaso es el **rate limit**, no el dinero.
- Para publicar hace falta **production key** (sitio verificado + ToS + Privacy).
- Hay que construir y mantener nuestra propia caché/DB. Ver ADR-004.

### Cuándo revisar
Si Riot cambia precios/políticas, o si aparece una API de terceros seria y libre
(hoy no existe ninguna para datos por jugador).

---

## ADR-002 — "Campeón más jugado de toda la cuenta" se redefine

**Estado:** aceptada (condiciona el producto) · **Fecha:** 2026-11-24

### Contexto
Riot **no** expone "todas las partidas de la cuenta". El historial recuperable
está topeado en las últimas **~1000 partidas** (y 2 años de retención), según un
dev de Riot en `RiotGames/developer-relations` #957 (2024-07-15). No figura en la
documentación oficial. No existe endpoint de "partidas totales jugadas".

### Decisión
El feature pasa a ser: **"campeón más jugado en las últimas N partidas
recuperables (máx. ~1.000)"**, siempre mostrando en la UI la base del cálculo:
cantidad de partidas analizadas y rango de fechas.

### Consecuencias
- Nuestra DB se vuelve más valiosa que la ventana de Riot con el tiempo:
  guardamos append-only desde el día 1 → acumulamos historia propia.
- Nunca prometer "todas las partidas" en copy, SEO ni títulos.
- Los agregados se calculan sobre `puuid_matches` (nuestra tabla), no en vivo.

### Cuándo revisar
Si Riot publica un endpoint de stats agregadas por jugador.

---

## ADR-003 — Framework: Next.js 16.4 (App Router + Cache Components)

**Estado:** aceptada · **Fecha:** 2026-11-24

### Opciones evaluadas (estado nov-2026)

| Framework | Versión | Caché compartida | UI de filtros | Free tier | DX | Extensible | Nota |
|---|---|---|---|---|---|---|---|
| **Next.js** | 16.4 | ⭐ `'use cache'`, `cacheLife`, `cacheTag`, `cacheHandlers` | `searchParams` + RSC | Vercel Hobby (CPU activa) | ⭐ | ⭐ | RSC tiene costo mental |
| Astro | 7.4 | route caching estable (5 meses), providers CDN experimentales | ⭐ formularios GET, 0 JS | ⭐ el más barato | 8 | 7 | ideal para "páginas y tablas" |
| Nuxt 4 | 4.7 | ⭐ `defineCachedFunction` con SWR | 7 | 8 | 7 | 9 | mejor caché no-Next |
| SvelteKit | 3.0 | ❌ sin caché compartida nativa | 7 | 9 | 7 | 8 | remote functions aún experimentales |
| TanStack Start | 1.0 | ❌ (TanStack Query + lo tuyo) | 7 | 8 | 7 | 8 | recién estabilizado |
| React Router 7 | 7.18 | ❌ (Cache-Control al CDN) | 7 | 7 | 7 | 8 | RSC inestable |

Puntaje ponderado (caché 25 / filtros 20 / free tier 20 / DX 15 / extensible 10 /
perf 10): **Next.js 8.4 · Astro 8.4 · Nuxt 8.1 · SvelteKit 7.4 · TanStack 7.1 ·
React Router 6.8**.

### Decisión
**Next.js 16.4 App Router** con `cacheComponents: true`, desplegado en Vercel
Hobby. Desempate frente a Astro por:
1. caché por tags probada en producción y compartida entre instancias
   (`cacheHandlers` → Redis), que es exactamente el problema de una API con
   rate limit;
2. ecosistema shadcn/ui + Tailwind 4 + Recharts v3 para tablas y gráficos;
3. un único runtime Node donde el token bucket y el coalescing son
   implementables (en Cloudflare Workers el límite de 10 ms de CPU lo impide).

**Alternativa real:** Astro 7.4 si el sitio queda en "páginas + tablas + un
gráfico" y se prioriza costo/CPU. El operador ya conoce Next y Astro, así que el
riesgo de adopción es bajo en ambos casos.

### Consecuencias
- Hay que respetar el modelo de RSC: caché en el módulo de datos, no en el
  componente; `searchParams` es Promise en 16.
- Los minors de 16.x cambian firmas: pinear versión y actualizar con cuidado.
- Si el CPU de Vercel Hobby aprieta, escape hatch a Fly.io (~USD 3,69/mes).

### Cuándo revisar
Si aparece interacción cliente pesada (filtros instantáneos, comparador de
jugadores, live refresh) o si el CPU del Hobby se queda corto.

---

## ADR-004 — Topología de datos: Postgres + Redis + worker

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
El ingest de Riot no puede correr en el request del usuario: el token bucket
necesita un proceso persistente, y un perfil "cold" cuesta ~22 requests (hasta
1011 con backfill).

### Decisión
Tres capas:
1. **CDN/render cache** (Vercel): HTML 30–300 s, partidas inmutables `max`.
2. **Redis (Upstash free)**: `riotId→puuid` (∞), `matchId→JSON` (∞),
   `puuid→agregado` (10–30 min), locks `SET NX PX` por puuid.
3. **Postgres (Neon free)**: `matches`, `puuid_matches`, `champion_stats`,
   `puuid_sync`. Append-only, permite recalcular cualquier agregado futuro.

Ingest en un **worker separado** (GitHub Actions cron cada ~10 min o proceso Node
en Fly.io). Nunca desde un page view.

### Consecuencias
- Costo: USD 0/mes con los free tiers actuales.
- Cada feature futura (runas, split por cola, dúos) es una tabla de agregados
  nueva sobre el mismo almacén inmutable de partidas.
- Riesgo: free tiers que se pausan por inactividad (Supabase) → preferir Neon.

### Cuándo revisar
Si el volumen de puuids crece (Neon 1 GB) o si se necesita ingesta casi real-time.

---

## ADR-005 — Idioma y convenciones

**Estado:** aceptada · **Fecha:** 2026-11-24

UI y documentación en **español**; identificadores, endpoints y nombres de campos
en inglés. Nombres de campeones localizados con `es_ES` desde Data Dragon
(`data/es_ES/champion.json`), no hardcodeados.

---

## ADR-006 — Implementación de la v1 (sin DB todavía)

**Estado:** aceptada · **Fecha:** 2026-11-24

### Decisiones de implementación

1. **Caché con `fetch` + `revalidate`, no con `'use cache'`.** La caché por tag
   de Cache Components incluye el deployment ID en la clave (se vacía en cada
   deploy) y en serverless no persiste entre requests. Para v1, `fetch(url,
   { next: { revalidate } })` es lo que realmente guarda datos entre requests y
   deploys. Migrar cuando exista Redis (`cacheHandlers`).
2. **`revalidate: 120` por página de perfil.** ISR sobre el render completo;
   partidas individuales se cachean 30 días (son inmutables).
3. **24 partidas analizadas por defecto** (`RIOT_ANALYZE_COUNT`, máx. 100). Con
   dev key el costo de un perfil frío es 1 + 1 + 24 = 26 requests (~2 s). Un
   backfill de 1.000 partidas queda para el worker (fase 2).
4. **Modo demo** cuando no hay `RIOT_API_KEY`, pero **solo en desarrollo** o con
   `RIOT_DEMO=1`. En producción sin key se muestra un error: nunca datos falsos.
5. **Filtros por URL** (`?champion=Ahri&queue=solo`), sin estado de cliente: las
   páginas siguen siendo server components y las URLs se comparten.
6. **`championName` como clave** en todo el agregado, con test que lo cubre.
7. **TypeScript 6.0.3**, no 7: `typescript-eslint` (vía `eslint-config-next`) no
   soporta TS 7 todavía.

### Consecuencias
- Cero infraestructura: no hay DB ni Redis, el proyecto corre con `npm run dev`.
- El agregado por campeón cubre solo las últimas 24 partidas hasta la fase 2; la
  UI lo dice explícitamente.
- `npm run verify:riot` queda listo para cerrar los `[UNVERIFIED]` del doc.

---

## ADR-007 — Persistencia: SQLite (local) / Turso (nube), sin Redis

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
Analizar 1.000 partidas por visita es imposible: son ~1.011 requests y con dev
key son ~20 minutos. Hay que guardar cada partida una vez y reusarla.

### Decisión
1. **SQLite** como única base. En local es un archivo (`data/league.db`) y en
   producción **Turso** (SQLite replicado). Mismo SQL y mismo código: solo
   cambia `DATABASE_URL` (`file:` vs `libsql://`).
2. **Sin Redis por ahora.** La caché de `fetch` de Next cubre los datos
   calientes y el lock de sincronización se hace con un `UPDATE ... WHERE` en
   la propia tabla `puuid_sync`. Menos cuentas que crear, menos cosas que se
   caigan. Si algún día hace falta, se agrega sin cambiar el modelo.
3. **Guardamos los 10 participantes por partida** (~3 KB con índices): una
   partida es inmutable y sirve para cualquier jugador que haya estado en ella.
4. **No guardamos el payload completo de Riot.** Solo los campos que usamos
   (campeón, K/D/A, cola, duración, oro, CS, visión, daño). Si una feature
   futura necesita más, se puede volver a pedir por `matchId` (Riot lo permite
   por 2 años). Así una cuenta entera entra en ~3 MB.
5. **`champion_stats` no se materializa**: se calcula con `GROUP BY` sobre los
   participantes. Con ≤1.000 filas por jugador tarda milisegundos y no hay
   riesgo de agregados desactualizados.

### Costo real (todo gratis)
| Pieza | Plan free | Para qué alcanza |
| --- | --- | --- |
| SQLite local | ilimitado | desarrollo |
| Turso | 5 GB, 500M lecturas/mes, 10M escrituras/mes | ~1.500 cuentas analizadas completas |
| Vercel Hobby | 1M invocaciones, 100 GB | el sitio |
| GitHub Actions | 2.000 min/mes en repos públicos | el worker de ingesta |

Medición real: 39 partidas con 390 participantes = **0,12 MB** (3 KB/partida).
117 partidas con detalle tardaron 89 s y 80 requests con dev key.

### Consecuencias
- El perfil lee de la base: **0 requests a Riot** y ~0,25 s de render (contra
  3,3 s de la vía directa).
- La ingesta es resumible (`ids_cursor` + `backfill_state`) y tiene lock por
  jugador para que dos visitas simultáneas no dupliquen trabajo.
- Queda pendiente mover el worker a un cron (GitHub Actions) para que el
  historial se complete solo; hoy se corre con `npm run ingest`.

---

## ADR-008 — Producción: cola de pendientes + worker con presupuesto

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
En producción no hay disco persistente y el backfill de una cuenta (~1.000
partidas = ~1.011 requests) no entra en el request de un usuario, ni con
production key (20 s) conviene atarlo a una visita.

### Decisión
1. **Cola implícita en `puuid_sync`**: `backfill_state != 'done'` es la lista de
   pendientes. No hace falta una tabla de jobs: el estado ya existía.
2. **Worker desacoplado** (`npm run worker`): toma jugadores de la cola, les baja
   partidas con presupuesto de **tiempo** (`--minutes`) y de **requests**
   (`--budget`) y vuelve a encolarlos. Corre en GitHub Actions cada 10 minutos
   (gratis en repos públicos) y también a mano.
3. **Reanudable por cursor**: cada corrida mira la página 0 (partidas nuevas) y
   sigue el backfill desde `idsCursor / 100`, en vez de repetir las mismas
   páginas. Antes el worker re-leía siempre 0..N y un jugador completo nunca
   llegaba a `done`.
4. **Ventana explícita de 2 años** (`startTime`), que es lo que Riot retiene.
5. **La visita al perfil no bloquea**: si el jugador es nuevo, sincroniza 25
   requests y muestra el resto con barra de progreso; el worker completa.
6. **Sin Turso no hay producción**: Vercel no tiene disco persistente. Turso es
   el mismo SQLite (`libsql://`) y el código no cambia.

### Consecuencias
- El worker no gasta el request de resolver el Riot ID: trabaja con el `puuid`
  guardado (`syncPuuid`).
- Costo por cuenta nueva: ~1.011 requests **una vez**; después, 1 request por
  corrida para detectar partidas nuevas.
- Un amigo que jugó con alguien ya cacheado cuesta 0 requests de detalle.
- Límites de Turso: 12 escrituras por partida (1 partida + 10 participantes +
  1 vínculo). 10M/mes ≈ 800 cuentas completas.
- **La cola no puede mirar solo `backfill_state`**: "done" significa "ya descubrí
  todos los IDs", no "ya bajé todos los detalles". El worker selecciona a quien
  tenga IDs pendientes de detalle, aunque el descubrimiento esté completo.
- **Turso no acepta `PRAGMA user_version = N`**: la versión del esquema se guarda
  en una tabla `meta`. Con eso el arranque en frío hace 2 viajes en vez de 8.
- **Una sola consulta por render**: `getPlayerMatchesWithProgress` trae partidas
  y progreso juntos (cada query a Turso es un viaje de red).

---

## ADR-009 — Ingesta acotada por tiempo (y no por suerte)

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
El botón "Cargar todo el historial" pide tandas de `RIOT_SYNC_CHUNK` requests.
Medido contra una cuenta con ~500 partidas: la tanda 1 tardó 17,8 s, la 2 50,6 s
y la 3 **60,5 s**, porque el bucket de la dev key (100/2min) se satura y el
cliente duerme esperando turno. Con `maxDuration = 60` eso significa que la
función puede morir a mitad de tanda; entonces el `finally` no corre, el lock
queda tomado **10 minutos** (`tryLockSync(..., 600)`) y todas las llamadas
siguientes devuelven `skipped: true`. El loader giraba en silencio: la cuenta
quedaba "trabada" sin ningún mensaje.

### Decisión
1. **Deadline absoluto** (`IngestOptions.deadlineAt`) que comparten resolver el
   Riot ID y bajar partidas: una sola hora límite por vuelta, no una por etapa.
   El route usa 40 s (`RIOT_SYNC_DEADLINE_MS`), por debajo de los 60 s.
2. **El token bucket no espera más allá del deadline**: `acquire(deadline)`
   devuelve cuánto habría que esperar y `riotFetch` corta con
   `RiotDeadlineError` (que además lleva ese `retryAfterMs` para que el cliente
   sepa cuánto dormir). Sin esto, la tanda podía dormir 2 minutos y pasar el
   límite igual.
3. **Cortar no es fallar**: `syncPuuid` atrapa `RiotDeadlineError`, guarda el
   cursor y el progreso, y devuelve `done: false` con `phase` y `elapsedMs`.
   El lock se libera siempre.
4. **Timeout por request** (`RIOT_REQUEST_TIMEOUT_MS`, 15 s) con
   `AbortSignal.timeout`: un socket colgado ya no bloquea la tanda.
5. **El lock dura lo que dura la tanda** (`deadline + 30 s`, no 600 s): si la
   función muere igual, la cuenta se destraba en un minuto y medio.
6. **Una partida que Riot ya no tiene (404/400) sale de la cola**
   (`forgetMatchId`). Antes abortaba la tanda entera y, como `pendingMatchIds`
   la devolvía siempre primera, el backfill no avanzaba nunca más. Un 5xx o un
   timeout **sí** se reintenta: no se descarta nada por un error transitorio.
7. **Un backfill terminado no vuelve a "partial"**: cuando el estado ya es
   `done` solo se lee la página 0, que viene llena, así que `reachedEnd` es
   falso por definición. Antes eso pisaba el estado en cada vuelta y la cuenta
   volvía a la cola del worker (y el `done` del botón parpadeaba).

### Consecuencias
- Ninguna vuelta puede pasarse de `maxDuration`: el peor caso es ~40 s de
  requests + DB.
- El cliente recibe siempre un motivo (`phase`: `ids` / `details` / `locked` /
  `throttled` / `done`) y, cuando corresponde, cuánto esperar.
- Una tanda puede devolver 0 requests y `phase: "throttled"`: es el bucket
  saturado, no un error. El cliente duerme y reintenta; no cuesta requests.
- Se pierden a propósito las partidas que Riot borró: quedan fuera de `known`,
  así "X de Y" sigue siendo honesto y la cola no se traba.
- El CLI y el worker siguen sin deadline propio (ya tienen el suyo por fuera,
  `--minutes`): no cambian.

---

## ADR-010 — Un jugador puede tener varios puuids

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
`keke#6seve` tiene **dos** puuids: `077q-0aRX…` (el que devuelve `account-v1`
hoy) y `lWjGSvL6…`, que Riot ya ni puede descifrar ("Bad Request - Exception
decrypting") pero que sigue apareciendo como participante en las partidas
viejas. Su historial quedó partido: 714 partidas con el viejo y 42 con el nuevo.

El perfil mostraba **714 de 756** y, al recargar, volvía a 714 aunque el botón
hubiese llegado a 756. No era un contador roto: había **tres definiciones** de
"partida analizada":

1. `getProgress` (lo que reporta el botón): link + fila en `matches` → 756.
2. El perfil: link + fila en `matches` **+ fila de participante de ese puuid**
   → 714, porque 42 partidas listan al jugador con el puuid nuevo.
3. El `done` del ingest, calculado con (1) → 756, "terminado".

### Decisión
1. **Las lecturas aceptan un conjunto de puuids** (`string | readonly string[]`):
   `getProgress`, `pendingMatchIds` y `getPlayerMatchesWithProgress`.
2. **`getAliasPuuids(puuid)`** une por Riot ID con **dos fuentes**: los
   `puuid_sync` que comparten `game_name`/`tag_line` **y** los `riot_id` que
   quedaron guardados en `match_participants`. La segunda es la que no depende
   de Riot: `account-v1` puede devolver (o tener cacheado) el puuid viejo y las
   partidas ya tienen el nuevo escrito. El perfil además suma el puuid que
   devolvió Riot en esa visita (puede no tener fila todavía).
3. **Una partida cuenta como analizada solo si el jugador aparece de verdad en
   ella** (fila de participante de cualquiera de sus puuids). Es la misma
   definición para el botón, para la página y para el `done`.
4. **Un link que Riot desmiente se descarta**: si el payload de la partida no
   lista al jugador, `forgetMatchId` borra el link. Antes ese link quedaba
   pendiente para siempre (o invisibile) y el progreso no cerraba nunca.
5. **`GROUP BY match_id`** en la lectura del perfil: la misma partida puede
   estar linkeada con los dos puuids y se mostraría dos veces.

### Consecuencias
- keke: 756 de 756, una sola vez cada partida, `done` de verdad.
- El ingest sigue escribiendo bajo el puuid que resuelve Riot; los alias son de
  lectura, no hace falta migrar ni reescribir datos.
- `getAliasPuuids` son 2 queries por vuelta (estado + nombres) y 1 por render de
  perfil: aceptable frente a tener números que no cierran.
- Un `puuid_sync` con nombre repetido y puuid inválido ya no rompe nada: se suma
  como alias y sus partidas se siguen mostrando.
- **`account-v1` ya no se cachea una semana** (`revalidate: 3600`): suponer que
  el puuid es inmutable fue el error. Con una hora, si Riot lo reasigna, se
  corrige solo; mientras tanto los alias por `riot_id` sostienen los datos.
- `/api/sync` devuelve el `puuid` con el que trabajó: si vuelve a pasar algo
  raro con una cuenta, se ve en la respuesta sin adivinar.

---

## ADR-011 — Sistema visual: estética de dpm.lol

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
El operador pidió que la UI copie la estética de **dpm.lol** (tracker de LoL) sin
sumar ni restar funcionalidades. dpm.lol está detrás de Cloudflare: el HTML no se
puede bajar con `curl`/headless. Se obtuvo el HTML renderizado vía `r.jina.ai`
(`X-Return-Format: html`) y, de ahí, sus **CSS compilados**
(`/_next/static/chunks/*.css`), que sí se sirven sin challenge. El diseño se
reconstruyó desde esa fuente primaria (tokens + markup), no de memoria.

### Tokens tomados de su CSS (scope `theme-rft`, tema oscuro)
| Token dpm | Valor | Uso en league-page |
|---|---|---|
| `--background` | `#131619` | `bg-bg` |
| `--card` | `rgb(222 204 251 / .04)` ≈ `#1b1d22` | `bg-card` / `.panel` |
| `--muted` | `#242832` | `bg-soft` (chips, tracks) |
| `--foreground` | `#f9fafd` | `text-fg` |
| `--muted-foreground` | `#9b9c9e` | `text-muted` |
| `--primary` | `#a6b0f2` | `text-primary`, botones |
| `--success` / `--destructive` | `#4ac97e` / `#f7665e` | `win` / `loss` |
| `--gold` / `--rank-gold` | `#ffd147` | WR alto y rango |
| `--dpm-blue-600/25` | `#1f264a` medido en pixel | tinte de fila ganada |
| `--destructive/20` | `#452b2c` medido en pixel | tinte de fila perdida |
| `--radius` | `.5rem` (cards `rounded-md` 6px) | `.panel` |
| fuente | **Plus Jakarta Sans** 200–800 | `next/font/google` |

### Decisiones
- Los tokens de `globals.css` son **semánticos** (`bg`, `card`, `soft`, `line`,
  `fg`, `muted`, `dim`, `primary`, `gold`, `win`, `loss`, `blue`, `orange`), no
  nombres de la paleta vieja (`ink-*`, `gold-*`): si mañana cambia el tema se toca
  un solo archivo.
- Utilidades propias en `@layer utilities`: `.panel` (tarjeta dpm), `.section-title`
  (12px bold uppercase primary), `.label` (10px uppercase), `.match-row` (barra de
  62px con tinte + brillo diagonal).
- La fuente se self-hostea con `next/font/google` (sin requests a Google en
  runtime, sin dependencia nueva).
- **Cero cambios funcionales**: mismas rutas, mismos datos, mismos filtros. Solo se
  movió el filtro por cola a la barra de tabs del hero (era una fila de chips) y el
  `ProfileCard` pasó a hero full-width + tarjetas de rango, como en dpm.

### Consecuencias / cuándo revisar
- Cualquier feature nueva debería usar los tokens y no colores sueltos.
- Si dpm.lol cambia de piel, este ADR queda como registro de la versión copiada
  (patch 16.23.1, noviembre 2026).

---

## ADR-012 — La fila de partida despliega el detalle en la misma página

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
La lista de "Últimas partidas" linkeaba cada fila a `/partida/[matchId]`, una
página aparte. Para ver qué pasó en una partida había que salir del perfil,
perder el scroll y volver. El operador pidió que la fila se despliegue hacia
abajo con la información de la partida; además, que las filas queden un poco
más separadas, que no aparezca el badge "V/D" ni el cartel "Victoria/Derrota"
(el tinte de la fila ya lo dice y el color no es el único indicador: la fila
también se lee en el KDA y en el resultado del desplegable).

### Decisión
- `MatchList` pasa a **client component** (`useState` con el id abierto: se abre
  de a una partida por vez). La fila es un `<button aria-expanded aria-controls>`,
  no un `<Link>`.
- **El detalle se carga al desplegar** (`GET /api/partida/[matchId]`), no en el
  render del perfil. Motivo: `getPlayerMatchesWithProgress` trae una sola fila por
  partida (el participante del jugador) — es la consulta que permite listar 1.000
  partidas en un viaje —, así que el roster completo no está en memoria. El
  endpoint lee `match_participants` (donde `saveMatch` guardó los 10) y arma
  `{ teams: PanelTeam[] }`. **Nunca sale a Riot**: desplegar no gasta rate limit.
  `Cache-Control: s-maxage=86400` porque las partidas son inmutables.
- Mientras carga, la fila muestra un esqueleto ("Cargando los 10 jugadores…");
  si la partida no está en la base, un aviso + link a `/partida/[matchId]`.
- Cuando la partida **sí** llegó con sus 10 jugadores (vía directa a Riot o modo
  demo), `teamsByMatch` viene pre-armado y el desplegable no pide nada.
- La tabla de los dos equipos se extrajo a `src/components/match-teams.tsx`, que
  usan tanto el desplegable como `/partida/[matchId]` (una sola fuente de markup).
- La ruta `/partida/[matchId]` **se mantiene**: la usan los cuadraditos de "forma
  reciente" y sirve para compartir una partida.

### Horas y fechas: zona horaria fija
`MatchList` ahora renderiza en el navegador, y `Intl` con la zona del server (UTC
en Vercel) no coincide con la del usuario → React detecta diferencia al hidratar.
Dos medidas:
1. `DISPLAY_TIME_ZONE` (`America/Argentina/Buenos_Aires`) fija en `formatClock()` y
   `formatDate()` (`src/lib/riot/aggregate.ts`), así el server y el navegador
   formatean igual.
2. Las horas, fechas y el "hace 2 h" de cada fila se **pre-formatean en el server**
   (`matchTimes`, prop `times`): el cliente no calcula nada dependiente de "ahora".
   El único formateo que queda del lado del cliente es `formatDuration`, que es
   aritmética pura (mm:ss) y no depende del locale.

### Consecuencias
- Abrir una partida no navega, no pierde el scroll y no gasta requests a Riot;
  el detalle completo cuesta **una** lectura a la base la primera vez, y después
  la cachea el navegador (estado) y el borde (`s-maxage`).
- El HTML del perfil ya no incluye 10 filas × 20 partidas: el payload de la lista
  volvió a ser el de antes.
- Si algún día se agrega el timeline de la partida, va por el mismo endpoint y hay
  que revisar el TTL de caché.

---

## Registro de auditoría

**2026-11-24 — auditoría de `docs/API-LOL.txt` v1.0.** Un `evidence-auditor` sin
acceso web revisó el documento contra los briefs y detectó un **bug real de código**:
el agregador (§9.4) agrupaba por `championId` justo en las partidas donde Riot dice
que ese campo es inválido (pre-11.4). Corregido: se agrupa siempre por
`championName`. También se corrigieron las etiquetas de certeza (límites de dev key,
tope de 1000 partidas, TTLs de caché) y se agregó §18 con los `curl` que faltan
verificar con una key real. La conclusión de arquitectura no cambió.

**2026-11-24 — verificación con key real.** Aparecieron dos bugs que los tests
ahora cubren: (a) los params de Next 16 llegan **codificados** y se estaban
codificando dos veces (404 en cualquier nombre con espacio); (b) `summoner-v4` y
`league-v4` pegaban al host **regional** en vez del de **plataforma** (mismo
gotcha que documenta `API-LOL.txt` §5, implementado al revés). El cliente ahora
usa un union discriminado (`{cluster}` vs `{platform}`) y `riotHost()` tiene
test propio para que no vuelva a pasar.

---

## ADR-013 — Branding: el producto se llama League Tracker

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
`league-page` era un nombre de trabajo (describía el repo). El operador pidió
cambiar el branding visible del sitio a **League Tracker** y usar como logo una
imagen provista por él.

### Decisión
- **Nombre visible:** `League Tracker` en `metadata.title` (`default` y
  `template`), header, footer y páginas legales. El nombre del repo y el `name`
  de `package.json` siguen siendo `league-page`: renombrarlos no aporta nada
  funcional y rompería rutas de deploy y documentación.
- **Logo:** `public/logo.png` (256×256, PNG con transparencia y paleta, ~33 KB)
  derivado de la imagen original 2048×2048 con el fondo recortado. Se sirve con
  `next/image` (32×32 en el header, con `priority` porque está above the fold).
- **Favicon e icono de app:** `src/app/icon.png` (192×192) y
  `src/app/apple-icon.png` (180×180), derivados de la misma imagen. Next los
  levanta por convención de file-based metadata, sin tocar `metadata.icons`.
- El logo tiene fondo transparente: antes de exportarlo se le recorta el margen
  vacío (`sharp.trim`) y se le deja un padding del 2 % para que no toque los
  bordes. En el header va sin fondo ni borde, con un `drop-shadow` y un
  `scale-105` al hover (el fondo lo pone el header).
- El wordmark queda como texto (`League` en `fg` + `Tracker` en `primary`) para no
  depender de una imagen de texto y mantener el look de dpm.lol (ADR-011).
- El aviso legal en inglés se reescribió con el nombre nuevo, sin cambiar el
  resto del texto exigido por Riot.

### Consecuencias
- Cambiar el nombre o el logo en el futuro es editar `layout.tsx` + reemplazar
  `public/logo.png`, `src/app/icon.png` y `src/app/apple-icon.png`.
- Ninguna otra capa (datos, API, DB) se ve afectada.

---

## ADR-014 — Buscador con sugerencias en el header (índice de cuentas propio)

**Estado:** aceptada · **Fecha:** 2026-11-24

### Contexto
El header tenía un link "Buscar" que llevaba a la landing. El operador pidió un
buscador directo en el header, con **preview de varias cuentas** a medida que se
escribe, "como op.gg, u.gg y dpm.lol".

El problema no es de UI sino de datos: **Riot no expone búsqueda por nombre**.
`ACCOUNT-V1` solo resuelve un Riot ID **exacto**
(`/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`); `SUMMONER-V4`
tiene `by-name` deprecado y también exacto. La FAQ de migración a Riot ID
(`developer.riotgames.com/docs/summoner-name-to-riot-id-faq`) responde que no hay
búsqueda y sugiere **mantener una base propia de jugadores** (paráfrasis; no hay
cita textual verificada). Fuentes consultadas el **2026-11-24** (ver al final).

Cómo lo resuelven los grandes (comportamiento observable, no su backend):
- **op.gg**: la búsqueda web exige región + `nombre#tagline`; la app de escritorio
  muestra una lista con juegos activos, servidor (KR/NA/EU), tier, nivel y stats
  recientes (help.op.gg, artículos de búsqueda y de búsqueda integrada).
- **dpm.lol**: un solo command palette en el header (`Ctrl+K`), placeholder
  "Search Summoner, Champion, Team, Pro…", y perfiles en `/{Nombre}-{TAG}` **sin
  región en la URL** → búsqueda global (dpm.lol + `dpm.lol/llms.txt`).
- **u.gg**: perfiles con región en el path (`/lol/profile/{platform}/…`), o sea
  búsqueda acotada a la región elegida (`u.gg/faq`; el dropdown exacto quedó
  `UNVERIFIED`, el sitio bloquea crawlers).
- **Ninguna API de terceros** con búsqueda por prefijo de cuentas: las que existen
  son scrapers de esos sitios (chocan con sus ToS y con la política de Riot sobre
  data brokering). Revisado: BALLDONTLIE (esports, no cuentas), wrappers tipo
  `opgg.py` (scraping). `UNVERIFIED` para cualquier dataset mantenido.

### Decisión
**Índice propio de cuentas + búsqueda global en el header.** Nada de fan-out a
Riot por tecla (no hay endpoint) ni de depender de un tercero.

1. **Tabla `accounts`** (una fila por puuid): `game_name`, `tag_line`,
   `name_lower` (para comparar sin distinguir mayúsculas), `platform_id`,
   `profile_icon`, `summoner_level`, `last_seen_ts`, `updated_at`. Esquema **v5**
   de `src/lib/db/client.ts`, con backfill de una sola vez desde
   `match_participants` (tomando el nombre de la partida **más nueva** de cada
   puuid) y desde `puuid_sync`.
2. **Se alimenta sola**, sin trabajo extra:
   - `saveMatch` agrega los 10 participantes al **mismo batch** de la partida
     (`accountUpsertStatement`), con la plataforma y el `gameStartTimestamp`.
   - `loadProfile` hace un `saveAccount` fire-and-forget con el nombre autoritativo
     de `account-v1` más icono y nivel de `SUMMONER-V4`.
   - El upsert **no pisa un nombre más nuevo con uno viejo** (el ingest baja del
     más nuevo al más viejo); una búsqueda directa sí gana siempre.
3. **`GET /api/buscar?q=&limit=&platform=`**: prefijo por `substr()` (no `LIKE`,
   así `%` y `_` son literales), `Nombre#TAG` filtra también por tag, orden
   exacto→más corto→más reciente. Devuelve `{ query, results[], indexed }` con
   `href` ya armado en el server y `iconUrl` de Data Dragon. **Nunca sale a Riot.**
   `Cache-Control: s-maxage=120`.
4. **UI (`HeaderSearch`)**: combobox ARIA con debounce de 180 ms, `AbortController`,
   cache por consulta, flechas + Enter + Escape, `/` y `Ctrl/Cmd+K` para enfocar.
   Enter resuelve en este orden: sugerencia elegida → Riot ID exacto tipeado →
   primera sugerencia. Las filas muestran icono, `Nombre#TAG`, región y nivel.
   La búsqueda es **global** (como dpm), no region-scoped: el índice es chico y
   obligar a elegir región primero solo agrega fricción. Para el Riot ID tipeado
   a mano se usa la región del perfil abierto o la última visitada
   (`localStorage: lt:platform`), con la de `.env` como fallback.
5. El link "Buscar" del nav desaparece (lo reemplaza el input). En mobile el nav
   se oculta y los links quedan en el footer.

### Limitación (dicha en la UI, no escondida)
El autocompletado **solo sugiere cuentas ya indexadas**: las que aparecieron en
partidas que ya bajamos y las que alguien visitó. op.gg/u.gg/dpm tienen años de
crawl; nosotros arrancamos con lo que hay en la base (5.447 cuentas locales al
momento de este ADR) y crece con cada partida ingerida. Por eso el desplegable
siempre ofrece además "ir a `Nombre#TAG`", que resuelve contra Riot como antes.
La cobertura mejora con el worker: cada partida nueva suma 10 cuentas.

### Alternativas descartadas
- **Pedirle a Riot en cada tecla**: imposible, no hay endpoint (y sería rate-limit
  suicide).
- **Scrapear op.gg/u.gg**: viola sus ToS y la política de datos de Riot.
- **API de terceros**: ninguna confiable ni legal (ver arriba).
- **`LIKE 'prefijo%'`**: descartado por los comodines; `substr()` es exacto y a
  esta escala (miles de filas) sobra. Si algún día crece, FTS5 es el paso natural.

### Consecuencias
- Subir el esquema a v5 corre el backfill una vez por base (en bases nuevas es un
  no-op). Es la primera migración con datos, no solo con `ALTER TABLE`.
- El buscador no gasta rate limit de Riot: una búsqueda = una query SQLite/Turso.
- `saveMatch` crece 10 statements por partida (mismo viaje de red).
- Tests: `src/lib/db/accounts.test.ts` (prefijo, tags, `%` literal, nombre viejo
  vs. nuevo, icono que sobrevive, `saveMatch` alimentando el índice) y
  `src/lib/search.test.ts` (parseo de Riot ID + contrato de la API).

### Fuentes (consultadas 2026-11-24)
- Riot: `developer.riotgames.com/api-details/account-v1` y `.../summoner-v4`
  (operaciones exact-match, sin search).
- Riot: `developer.riotgames.com/docs/summoner-name-to-riot-id-faq` (sin búsqueda;
  base de jugadores propia) y `.../docs/lol` (migración a Riot ID).
- op.gg: `help.op.gg/hc/en-us/articles/31090336977177`,
  `.../48464937576473` (resultados con región/tier/nivel), `.../31088821370777`.
- dpm.lol: home + `dpm.lol/llms.txt` + un perfil (`/HansD4mpf-EUW`).
- u.gg: `u.gg/faq` + URLs de perfil con plataforma en el path.
- No verificable: dropdown exacto de u.gg (`UNVERIFIED`, Cloudflare), volumen y
  latencia de los índices de op.gg/u.gg/dpm (`UNVERIFIED`).

---

## ADR-015 — Chip "en partida ahora" con SPECTATOR-V5

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto
El operador preguntó si se puede ver si el jugador del perfil está en una
partida en vivo. **Sí**: `SPECTATOR-V5` expone
`GET /lol/spectator/v5/active-games/by-summoner/{puuid}`. Verificado en vivo el
2026-11-25 con la dev key: `200` con los 10 participantes para un jugador que
estaba jugando y `404` para los que no.

Es el **único dato del sitio que es tiempo real**: no puede venir del ingest ni
del worker, porque tiene que pedirse en el render.

### Decisión
Chip opcional en el hero del perfil (`En partida · Solo/Duo · 24:46 · Swain`),
resuelto en el server, con estas reglas:

1. **Host de plataforma** (`{platform}.api.riotgames.com`). Con el cluster Riot
   devuelve 403 (verificado). Encaja en `RiotTarget` como `{ platform }`.
2. **`revalidate: 60`**: el badge puede quedar hasta un par de minutos viejo
   (lo acota también el `revalidate` de la página). Preferible a un endpoint
   propio + polling del cliente: cero JS extra y cero fan-out por page view.
3. **404 = `null`, no error**; cualquier otro fallo también degrada a "sin
   badge". `getActiveGame()` es honesto (404→null, 429/5xx tira) y
   `findActiveGame()` es el que se traga todo para no romper el perfil.
4. **Tope de 2 puuids** por visita (ADR-010: Riot reasigna puuids), cortando en
   el primero que devuelve 200. Al primer error se corta la visita entera: si
   Riot está limitando, no insistimos.
5. **No se usa `riotId`** como identidad: viene en la respuesta pero **no está
   documentado** (`httpStatus`/`errorCode` sí lo está; `riotId` y
   `lastSelectedSkinIndex` no). El nombre visible sale de nuestro índice
   `accounts` y el campeón de Data Dragon por `championId`.
6. **Reloj**: lo cuenta el **browser**, no el server. El chip recibe
   `startedAt` (epoch de `gameStartTime`) + `base` (segundos que calculó el
   server) y avanza con un `setInterval` de 1 s: cero requests, cero polling a
   Riot. Los helpers puros viven en `src/lib/live.ts` para que el client
   component no arrastre `http.ts` al bundle.
   Si el absoluto (`ahora - startedAt`) se aleja >10 min de `base`, cae a
   `base + tiempo desde el montaje` (navegador con hora mal) y si Riot omitió
   ambos campos (partida recién creada) el chip sale sin reloj. Pasadas 3 h se
   esconde: no es una partida, es un dato viejo.

### Consecuencias
- Costo: 1–2 requests por perfil caliente por minuto (~50 jugadores distintos
  simultáneos con la dev key). Documentado en `docs/API-LOL.txt` §11 y §7.9.
- Cobertura: solo LoL. Un jugador en TFT da 404 (TFT usa `spectator-tft-v5` con
  `by-puuid`), así que el chip significa "en una partida de LoL".
- El `gameId` es el sufijo del futuro matchId (`LA2_<gameId>`), pero no se linkea
  todavía: no está medido cuándo lo resuelve match-v5 (queda en §16 UNVERIFIED).
- Tests: `src/lib/riot/spectator.test.ts` (13 casos) con el payload real del
  200 y el 404, el mapeo puro, el reloj y la degradación.

### Fuentes (consultadas 2026-11-25)
- `developer.riotgames.com/api-details/spectator-v5` (bloque AJAX real; el HTML
  de `/apis` no trae la tabla) y `.../api-details/spectator-tft-v5`.
- `developer.riotgames.com/docs/lol` (platform routing) y `.../docs/portal`
  (rate limiting: no publica el límite por método).
- Curl propio: `200`/`404`/`403`/`400` en `la2`, `na1`, `kr`, `me1`, `americas`.

---

## ADR-016 — "Actualizar ahora": una acción, en el hero del perfil

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto
El operador pidió un botón **al lado del perfil** que diga "Actualizar ahora",
que traiga las partidas que todavía no están cargadas, muestre una **luna
parpadeando** mientras trabaja y **refresque la página sola** al terminar.

Hasta acá la acción vivía adentro del bloque "Progreso del análisis" (abajo,
entre las estadísticas), con el label "Cargar todo el historial". El motor ya
existía: `POST /api/sync` es **incremental y resumible** (descubre IDs nuevos y
baja solo los detalles que faltan) y el cliente lo llamaba en bucle hasta
`done`.

### Decisión
**Mover la acción al hero y dejar el panel de progreso como información.**

1. `ProfileHero` acepta un slot `actions` (a la derecha del nombre; en mobile se
   apila abajo). Ahí vive el botón.
2. El botón es `src/components/refresh-button.tsx` (reemplaza a
   `sync-button.tsx`, que se borra): mismo motor — bucle de tandas, `Detener`,
   detección de "sin avance" a los 90 s, reintento con `retryAfterMs` cuando
   Riot limita o hay lock — con feedback **compacto**: luna (`Moon` de lucide)
   con `animate-pulse` mientras corre, `Actualizar ahora` / `Actualizando…`, una
   línea `34 de 361 · 9% · 0:42` y una barra de 1 px.
   *Revisado en ADR-017:* la luna y el contador se fueron; quedó el formato de
   dpm.lol (`Actualizado` con check / `Actualizar` con flecha / `Actualizando…`
   con spinner, y el avance `34/361 · 9%` al lado del botón).
   *Revisado en ADR-019:* también se fueron el avance, la barra y `Detener`;
   mientras corre solo se ve el botón con "Actualizando…".
3. Se **elimina el bloque "Progreso del análisis"** de la página: sus dos datos
   (`X de Y` y "Riot permite ~1.000") ya están en la línea del botón y en el
   pie de la página. Queda solo el banner de "Historial completo".
4. Al llegar a `done`: `finish()` + `router.refresh()`. La página se redibuja
   sola con las partidas nuevas y el botón **vuelve a quedar disponible** (antes
   se quedaba mostrando "Historial completo" para siempre, que con el botón en
   el hero dejaría la página sin acción).
5. El contador no guarda `known`/`detailed` como verdad: guarda un **snapshot
   con los props con los que se generó** y en render solo se usa si los props no
   cambiaron. Cuando el refresh trae números nuevos, el snapshot se descarta
   solo — sin `setState` dentro de un `useEffect` (que el linter de React
   rechaza por cascada de renders).
   *Revisado en ADR-019:* sin contador ni barra, ese snapshot ya no existe.
6. En modo demo no se renderiza: sin `RIOT_API_KEY`, `/api/sync` devuelve 503.

### Consecuencias
- Una sola acción por página (antes estaba abajo y competía con el panel).
- `done` puede tardar minutos en una cuenta con backlog grande (con dev key son
  ~27 partidas por vuelta de ~15 s). Es el precio de cargar el historial de
  verdad; el avance queda guardado.
  *Revisado en ADR-019:* ya no hay `Detener`; el loop se corta solo a las 60
  vueltas o cuando Riot no da turno, y se retoma al volver a tocar el botón.
- Aritmética de la tanda extraída a `src/lib/sync-progress.ts` (puro) con tests:
  tanda incremental, cuenta nueva, denominador que crece y el caso 0/0.
  *Revisado en ADR-019:* `batchProgress` se eliminó junto con el contador;
  quedaron `formatElapsed` y `decideAfterRound`.

---

## ADR-017 — El botón sabe si Riot tiene partidas nuevas (y por qué mentía)

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto (el bug)
El botón decía "Actualizado" con partidas nuevas sin cargar. Reproducido con
datos reales: para `keke#6seve`, Riot devolvía `LA2_1639883346` como partida más
nueva y nuestra base llegaba a `LA2_1639879656`.

La causa no era el botón sino **de dónde salía la respuesta**:
`pending = known - detailed` y `done` se calculan sobre `puuid_matches`, o sea
sobre las partidas que **ya descubrimos**. Una partida jugada después del último
sync no está ni registrada: no suma a `known`, no suma a `detailed` y no genera
fila pendiente. Resultado: "0 pendientes" era cierto y "al día" era falso.

### Decisión
**Comparar contra Riot, no contra nuestra cola.** 1 request, solo IDs:

```
GET /lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=1
```

- `getNewestMatchId()` en `src/lib/riot/matches.ts`, con `revalidate: 45` (la
  respuesta cambia con cada partida). Host regional, 404 -> null.
- En `loadProfile`: si el ID más nuevo **no está en `matches`**, `hasNewMatches
  = true`. Si la llamada falla (429/5xx), también: sin prueba no se afirma
  "al día" (conservador).
- `upToDate = !hasNewMatches && sin pendientes && backfill recorrido`. Es lo que
  decide el label: **"Actualizado"** vs **"Actualizar"** (formato de dpm.lol,
  que muestra "Update now" / "Up to date").
  [CORREGIDO EN ADR-018] Comparar contra la tabla `matches` era demasiado
  optimista (la partida puede estar guardada por otra persona) y el loop del
  cliente podía cerrar sin consultar a Riot. La definición vigente es
  `checkNewestMatch()` + `isMatchLoadedForPuuids()`, y `isSettledAfterRound`
  fue reemplazado por `decideAfterRound`.
  [NOTA] La forma exacta del botón de dpm (medidas, colores, textos de los
  estados intermedios) quedó **UNVERIFIED**: su perfil devuelve 403 a curl y un
  crawl con browser se cortaba por navegaciones de la SPA. Lo único verificado
  es el literal "Update now" en el HTML crawleado del perfil
  (`research/crawled/dpm-lol/https-dpm-lol-hansd4mpf-euw.md`, 2026-11-24) y
  ubicación (al lado del Riot ID, antes de las tabs). Se replicó el
  comportamiento (dos estados + spinner), no el pixel.
- Costo: +1 request por vista de perfil, cacheado 45 s. Es el mismo orden que el
  chip de partida en vivo (§7.9) y no crece con la cantidad de partidas.

### El loop del cliente también cambió
`done` del server sigue significando "backfill recorrido + nada pendiente". El
cliente ahora corta con `isSettledAfterRound({ done, pending, newIds })`:
`newIds` es el crecimiento de `known` en esa vuelta, así que una tanda que trae
una partida nueva sigue (aunque el backfill viejo esté incompleto) y una que no
trae nada y ya no tiene pendientes termina y refresca.

### Consecuencias
- El label nunca dice "Actualizado" sin haber consultado a Riot en los últimos
  45 s.
- Una cuenta con backlog grande sigue diciendo "Actualizar" hasta drenarlo:
  es honesto y es lo que se pidió en ADR-016 (cargar lo que falta).
- Se fue el contador de "N partidas analizadas" de al lado del botón: ahora el
  estado es el del botón (dpm) y los totales quedan en el banner de historial
  completo y en el pie del perfil.
- Tests: `isSettledAfterRound` (4 casos) en `src/lib/sync-progress.test.ts`.
- Verificado en vivo: `keke#6seve` -> "Actualizar" (ID nuevo ausente);
  `Carlos#RHLMC` -> "Actualizado" (su ID más nuevo **sí** está en la base).

---

## ADR-018 — "Actualizado" solo con confirmación de Riot (fin del ida y vuelta)

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto (el ida y vuelta)
En `Carlos#RHLMC` el botón decía **"Actualizar"** al entrar, al apretarlo decía
**"Actualizado"** y al recargar volvía a **"Actualizar"**. No era un problema
de datos: la base tenía 473/473 partidas y el backfill en `done`.

Se reprodujo con datos reales. La partida más nueva era `LA2_1639441889`:

1. Se borró el link de esa partida para el jugador (la base quedó 472/472) y el
   perfil dijo "Actualizar" (correcto: Riot tenía algo no cargado).
2. Se puso el lock de sync y se llamó `POST /api/sync`. El server devolvió
   `{"done":false,"requests":0,"skipped":true,"phase":"locked"}`.
3. El cliente calculaba `pending = known - detailed = 0` y `newIds = 0` y
   `isSettledAfterRound` devolvía `true`: decía "Actualizado" **sin haber
   consultado a Riot**. Al recargar, el perfil volvía a "Actualizar".

Lo mismo pasaba con un `429`, con un `RiotDeadlineError` (sin turno en el
rate limit) y con cualquier vuelta que no hiciera ningún request. Con la dev
key (100 requests/2 min) es fácil de encontrar: la propia visita del perfil
gasta varios requests y la verificación puede quedar frenada.

Había dos causas más, del mismo tipo:

- `loadProfile` comparaba el ID más nuevo contra la tabla **`matches`**, que es
  compartida. Si otra persona ya había bajado esa partida, contaba como
  "cargada" aunque este jugador no tuviera ni el link ni su participante.
- El label tenía **dos fuentes de verdad**: el prop `upToDate` del server y un
  `settledFor` local que el cliente prendía al cortar el loop. Si el refresh
  posterior no cambiaba la firma de los props, el "Actualizado" local tapaba
  un `false` del server.

### Decisión
**Una sola definición de "al día" y una sola fuente de verdad.**

1. `src/lib/sync-status.ts` → `checkNewestMatch(puuids, platform, { deadline })`.
   Pide el ID más nuevo a Riot (1 request, cache 45 s) y lo compara con
   `isMatchLoadedForPuuids` (`src/lib/db/matches.ts`), que exige el link del
   jugador **y** su fila en `match_participants`. La usan `loadProfile` y
   `syncPuuid`, así el render y `/api/sync` no pueden discrepar.
2. `syncPuuid` devuelve `upToDate: boolean | null` además de `done`. `done`
   sigue significando "nuestra cola está drenada"; `upToDate` es la
   verificación contra Riot. `null` = no se pudo verificar (429/5xx/timeout/
   sin presupuesto): no se afirma nada.
3. El cliente **solo** declara "Actualizado" con `upToDate === true`.
   `decideAfterRound` (`src/lib/sync-progress.ts`) reemplaza a
   `isSettledAfterRound`:
   - confirma → `settle`;
   - cola drenada sin confirmación → reintenta la verificación (máx. 3);
   - Riot confirma que hay una partida nueva: reintenta 1 vez (puede ser una
     partida jugada durante la vuelta); si sigue sin cargarse, `stop` honesto;
   - 5 vueltas seguidas sin ningún request (429/lock/deadline) → `stop`
     honesto.
   Se fue el `settledFor`: el label sale del prop del server, sin excepciones.
4. `router.refresh()` va dentro de `useTransition`: mientras trae los props
   frescos el botón sigue en "Actualizando…" y no parpadea con el label viejo.
5. La verificación usa la **misma ventana de 2 años** que el ingest
   (`startTime`) y redondea el `since` al día para que la URL no cambie en cada
   vista (si cambiara segundo a segundo, el cache de `fetch` no acertaría
   nunca).
6. Si la verificación falla, `loadProfile` sigue con `upToDate: false`
   (conservador, como pedía ADR-017) pero agrega `verificationUnknown: true`:
   la UI muestra una nota de "no pude verificar con Riot" en vez de un
   "Actualizar" seco.

### Consecuencias
- El botón ya no puede decir "Actualizado" por una vuelta que no habló con
  Riot. Un lock, un 429 o un deadline dejan el botón en "Actualizar" con un
  aviso, no en un estado falso.
- Si Riot no responde, el perfil no miente: dice que no pudo verificar. La
  próxima vista (o el botón) reintenta.
- `upToDate` ahora es estrictamente "Riot no tiene nada más nuevo **para este
  jugador**", no "la partida existe en la tabla compartida".
- Tests: `decideAfterRound` en `src/lib/sync-progress.test.ts` (6 casos,
  incluido el regression: `done:false` + `requests:0` **no** termina).
- Verificado en vivo el 2026-11-25 con `Carlos#RHLMC`: sync normal devuelve
  `done:true, upToDate:true`; con el lock puesto devuelve
  `done:false, upToDate:null, requests:0`, que ahora el cliente trata como
  "seguir/reintentar" y nunca como "Actualizado".

---

## ADR-019 — Mientras actualiza, solo el botón

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto
Al apretar "Actualizar" aparecían, al lado del botón, el avance
(`34/361 · 9% · bajando detalles`), un botón **Detener**, una barra de 1 px y el
aviso de "sin avance". El pedido fue que quede **solo el botón
"Actualizando…"**.

### Decisión
- `RefreshButton` se queda con el estado mínimo: `{ running, error, notice,
  unavailable }`.
- Mientras corre se renderiza **solo el botón** con spinner y "Actualizando…".
  Se fueron el contador, `PHASE_LABEL`, la barra, el cronómetro (`now`), el
  aviso de "sin avance" y el botón Detener.
- El `AbortController` queda solo para cortar el request si desmontan la
  página.
- Los avisos de rate limit/lock y los errores **siguen apareciendo debajo**: no
  son controles, explican por qué la vuelta no avanzó.
- El loop conserva sus topes: `MAX_ROUNDS` y `decideAfterRound` (5 vueltas sin
  request). Sin Detener, esos son los frenos.
- Se borró `batchProgress` y sus tests (ya no lo usaba nadie); en
  `src/lib/sync-progress.ts` quedan `formatElapsed` y `decideAfterRound`.

### Consecuencias
- El hero queda limpio: una sola acción y un solo estado visible.
- No se puede cancelar a mano. Si una cuenta tiene un backlog enorme, el usuario
  puede navegar (el abort corta el fetch) y retomar después: el sync es
  resumible y el avance queda en la base.
- La regla de ADR-018 no cambia: "Actualizado" sigue dependiendo de
  `upToDate === true`.
  *Revisado en ADR-021:* la barra vuelve **solo** cuando la tanda supera las 50
  partidas pendientes; en tandas cortas se mantiene el botón solo.

---

## ADR-020 — El chip "En partida" se entera de que la partida terminó

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto (el badge pegado)
El perfil mostraba "En partida" con el reloj corriendo después de que el
jugador ya había terminado. No era un dato mal parseado: el render pedía
SPECTATOR-V5 una vez y **la página abierta no se volvía a renderizar**, así que
el chip seguía contando para siempre (hasta el tope de 3 h). Además:

- la caché era de 60 s, así que un refresh podía traer la foto vieja;
- "Actualizar" solo sincronizaba partidas; el `router.refresh()` posterior
  podía volver a pegarle a la misma entrada de caché de spectator;
- GitHub Actions no sirve para esto: corre en otra infraestructura, no comparte
  la Data Cache de Vercel y no puede actualizar una página ya abierta.

### Decisión
1. **Caché más corta y con tag.** `getActiveGame()` usa `revalidate: 30` y
   `tags: ["spectator"]`.
2. **"Actualizar" invalida el tag.** `POST /api/sync`, después de sincronizar,
   llama a `revalidateTag("spectator", { expire: 0 })` (Next 16: la forma de un
   argumento está deprecada). El `router.refresh()` que ya hace el botón
   encuentra la caché vencida y pregunta de nuevo: si la partida terminó, el
   chip desaparece en el acto.
3. **Poll liviano del chip.** `LiveBadge` consulta
   `GET /api/en-vivo?platform=&puuid=` cada 45 s (y no cuando la pestaña está
   oculta). El endpoint:
   - valida plataforma/puuid y devuelve `{ live: true | false | null }`;
   - usa `getActiveGame()` con un deadline de 3 s (si el bucket está seco, no
     cuelga el poll);
   - `404` -> `false` (partida terminada); `429/5xx/timeout` -> `null`
     (no sabemos: el chip se queda y reintenta).
4. El reloj sigue siendo local (cero requests). El poll es del **estado**, no
   del reloj.

### Costo y rate limit
El endpoint vuelve a usar la **misma caché de 30 s** de SPECTATOR-V5, no un
`no-store` contra Riot. Entonces:

- N espectadores de la misma partida comparten el request a Riot.
- Mientras un badge está visible, el costo máximo es ~2 requests por jugador
  por minuto (la caché de 30 s), no 1 por espectador.
- El reloj no agrega requests.

### Consecuencias
- Una partida terminada deja de mostrar el chip en ~45-75 s sin tocar nada; con
  "Actualizar" se va de inmediato.
- Si Riot está caído o limita, el chip **no desaparece por las dudas**: se
  mantiene y reintenta (fail-open), que es lo menos sorprendente.
- No hace falta un cron de GitHub Actions para el badge. El cron sigue siendo
  para ingerir partidas terminadas, no para refrescar UI.
- Verificado el 2026-11-25: `GET /api/en-vivo` con un puuid sin partida
  devuelve `{"live":false}` y con plataforma inválida 400.

---

## ADR-021 — Barra de progreso solo para tandas largas (>50 pendientes)

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto
ADR-019 dejó solo el botón "Actualizando…" para limpiar el hero. Pero en una
cuenta con cientos de partidas pendientes el visitante no tiene forma de saber
cuánto falta ni qué está haciendo el script en ese momento.

### Decisión
- `RefreshButton` vuelve a recibir `known`/`detailed` del server. Al arrancar
  guarda `baselineDetailed` y `batchTotal` (los pendientes de **esa** tanda).
- Mientras corre, si `batchTotal > 50`, muestra debajo del botón:
  - una barra de progreso (`analyzed / total`);
  - el texto `X de Y analizadas · Z% · faltan N · fase`.
- La fase sale de `/api/sync`: `ids` → "buscando partidas", `details` →
  "bajando detalles", `done` → "verificando con Riot", `locked` → "esperando a
  otro proceso", `throttled` → "rate limit de Riot". Antes de la primera
  respuesta dice "buscando partidas".
- Si la tanda es de 50 o menos, no hay barra: solo el botón (ADR-019).
- El total se mide desde el clic y crece si Riot devuelve IDs nuevos a mitad de
  camino (`batchProgress`), así el porcentaje nunca pasa de 100 ni miente.
- Al terminar la barra desaparece; el label final sigue saliendo de `upToDate`
  (ADR-018).

### Consecuencias
- Las actualizaciones normales de 1-20 partidas siguen limpias.
- Un backfill grande muestra progreso real, con la fase del momento (incluso
  cuando está esperando el lock o el rate limit).
- `batchProgress` vuelve a `src/lib/sync-progress.ts` con tests (tanda
  incremental, cuenta nueva, denominador que crece, tope 100).

---

## Pendientes (no decididos todavía)

- [x] Persistencia + ingesta (fase 2): SQLite/Turso con backfill resumible.
- [x] Cron de ingesta en GitHub Actions (`.github/workflows/worker.yml`).
- [ ] Crear la base en Turso y deployar en Vercel (guía: `docs/DEPLOY.md`).
- [ ] Turso + deploy (**después de la UI**, por decisión del operador).
- [ ] Medir cuánto tarda un backfill completo de ~1.000 partidas con dev key.
- [x] Correr `npm run verify:riot` con una dev key. Hecho el 2026-11-24: límites
      reales confirmados (100/2min + 20/1s), paginación medida (~519 partidas en
      una cuenta de prueba) y endpoints de liga/maestría validados.

- [ ] Autenticación de usuarios (¿"login con Riot" RSO? Requiere production key).
- [x] Buscador con autocompletado en el header. Hecho el 2026-11-24 (ADR-014):
      índice propio de cuentas (`accounts`, esquema v5) + `GET /api/buscar`.
      Riot no tiene search de invocadores, así que sugiere cuentas ya indexadas
      (participantes de partidas guardadas + perfiles visitados).
- [x] "En partida ahora": hecho el 2026-11-25 (ADR-015) con SPECTATOR-V5.
      Chip opcional en el perfil, caché de 30 s, 404 degradado sin romper nada.
      ADR-020: poll de estado + invalidación del tag al "Actualizar".
- [x] Botón "Actualizar ahora" en el hero del perfil (ADR-016), con "Actualizando…"
      y `router.refresh()` al terminar. ADR-019: sin contador, barra ni Detener.
- [ ] Páginas de comparación / ranking global (necesitaría Meraki `championrates`).
- [ ] Gráficos (Recharts candidato).
- [ ] Tests: unitarios del agregador + smoke test contra API real con mock de fixtures.

---

## ADR-022 — Compañeros frecuentes ("duos") en la barra lateral del perfil

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto
Faltaba ver con quién juega el jugador: los 5 compañeros de equipo con más
partidas juntos, con partidas, victorias/derrotas, winrate, Riot ID, icono y
link a su perfil. La tarjeta va debajo de "Forma reciente", en la columna
izquierda del perfil.

El problema de datos: el perfil lee de la base **solo la fila del jugador** en
cada partida (`getPlayerMatchesWithProgress`), así que los otros 9 participantes
no están en memoria. La vía directa a Riot y el modo demo, en cambio, sí traen
el roster completo de las 24 partidas.

### Opciones evaluadas
| Opción | A favor | En contra |
|---|---|---|
| Calcular en memoria desde `matches` | cero SQL nuevo | en modo DB solo está el jugador: devolvería vacío |
| Bajar el roster de cada partida en la página | — | fan-out de N requests a Riot (prohibido por §2.5) |
| **Agregar en SQL sobre `match_participants`** | 1 query, sin requests externos, usa la PK `(match_id, puuid)` | joins sobre ~1.000 partidas por perfil |

### Decisión
- `getTopTeammates` (`src/lib/db/teammates.ts`) agrega en SQL:
  `puuid_matches` del jugador → `match_participants` del **mismo `team_id`**,
  excluyendo todos sus puuids. Nada de rivales.
- Respeta el tab de cola (`queueIds`) igual que "Forma reciente"; el filtro de
  campeón no aplica a la barra lateral.
- La identidad es el **Riot ID normalizado**, no el puuid (`mergeTeammates` en
  `src/lib/riot/teammates.ts`): Riot reasigna puuids y la misma persona
  aparecería partida en dos filas. Gana el nombre/icono de la partida más nueva.
- Demo y vía directa usan `topTeammatesFromMatches` (mismo shape y mismo merge)
  con el roster que ya vino en el payload.
- El icono sale de `accounts`; si esa fila es vieja y no tiene icono, se rescata
  el de la partida más nueva que sí lo trajo.
- La plataforma de Riot viene en mayúsculas (`LA1`); se normaliza a minúsculas
  antes de armar el link con `profileHref`. Sin Riot ID o plataforma válida, la
  fila queda como texto (nunca un link roto).

### Consecuencias
- Una query extra por render del perfil (≤5 filas), sin tocar el rate limit de
  Riot. Medido en local: perfil caliente ~0,6 s.
- El widget se actualiza solo al terminar el sync porque lee la base.
- Si el jugador tiene pocas partidas, muestra menos de 5 o el estado vacío.

---

## ADR-023 — Landing con hero de una pantalla y perfiles recomendados

**Estado:** aceptada · **Fecha:** 2026-11-25

### Contexto
La home competía consigo misma: hero con párrafo, formulario de dos campos +
select, link a comparar, tres tarjetas y el aviso de demo, todo en la primera
pantalla. Se pidió una home **estilo Apple**: un título y un buscador centrado
que ocupe la pantalla completa, y el resto de la información recién al
scrollear. Además, el buscador tenía que ofrecer **perfiles recomendados**.

La restricción de datos sigue siendo la de ADR-014: Riot no tiene búsqueda por
nombre y no sabemos nada de cuentas que nunca vimos. "Recomendar" solo puede
significar "elegir entre lo que ya tenemos indexado".

### Opciones evaluadas
| Opción | A favor | En contra |
|---|---|---|
| Recomendados server-side con `"use cache"`/`connection()` | sale en el HTML, sin skeleton | rompe el shell estático de `/` y toca la base en build; más superficie de error |
| Recomendados "curados" a mano en el código | simple | mentira: no conocemos cuentas fuera del índice |
| Endpoint + fetch del cliente (elegido) | `/` sigue siendo estática (○), el CDN cachea el JSON, una request por visita | la sección parpadea con skeleton en la primera visita |

### Decisión
- **Hero de un viewport**: `<section>` con `min-h-[calc(100svh-3.5rem)]`
  (`svh` = sin salto de la barra del navegador) y `-mt-6/-mt-8` para cancelar el
  padding de `<main>`; descontar los `h-14` del header evita un scroll de 56 px.
  Contiene **solo** el `<h1>` y `HeroSearch`. El aviso de demo, las features,
  los recomendados y "Sobre los datos" pasaron debajo.
- **Un solo buscador en la home**: `HeaderSearch` acepta `hideOnHome` y no
  renderiza nada en `/` (el buscador del hero es el protagonista). En el resto
  de las rutas el header sigue igual.
- `HeroSearch` (`src/components/hero-search.tsx`) es una píldora grande
  (`rounded-full`, `h-14`, fondo translúcido con blur) con ícono, input, región
  compacta y botón de submit. Al enfocarla o al escribir despliega el panel:
  **sin consulta** muestra recomendados; **con ≥2 caracteres** muestra las
  sugerencias de `/api/buscar` (misma lógica de debounce/abort/teclado que el
  header). Enter con `Nombre#TAG` resuelve contra Riot con la región elegida;
  Enter sin texto **no** navega a la primera recomendación (solo con sugerencias
  activas), para no mandar a nadie a un perfil ajeno sin querer.
- **Recomendados = cuentas del índice con más partidas guardadas**:
  `featuredAccounts()` (`src/lib/db/accounts.ts`) hace
  `accounts JOIN match_participants GROUP BY puuid ORDER BY COUNT(DISTINCT match_id) DESC,
  last_seen_ts DESC`. El `JOIN` deja afuera las cuentas sin partidas (visitadas
  por búsqueda directa): no hay nada que mostrar de ellas.
- `GET /api/recomendados` devuelve el mismo `SearchHit` de siempre + `games`.
  `Cache-Control: public, max-age=30, s-maxage=300, stale-while-revalidate=900`:
  el ranking cambia con el ingest, no con cada visita.
- La landing usa la lista dos veces (panel del hero y sección de abajo) y las
  dos comparten una única promesa (`src/lib/recommended.ts`), así que abrir el
  panel y scrollear no duplica el fetch.
- `mapAccountHits()` (`src/lib/search-hits.ts`) centraliza el mapeo fila →
  `SearchHit` (validar plataforma + icono de Data Dragon) para que `/api/buscar`
  y `/api/recomendados` no se desincronicen.
- Se eliminó `src/components/search-form.tsx` (formulario viejo de la home): el
  único buscador de la landing es `HeroSearch`.

### Consecuencias
- `/` sigue prerenderizada (aparece como `○` en el build): no hay DB ni Riot en
  el render. El costo es un skeleton de ~1 request cacheada por el CDN.
- Sin cuentas indexadas (base nueva) la sección no se muestra y el panel dice
  que escribas `Nombre#TAG`; en modo demo se recomienda la cuenta de ejemplo.
- El ranking es de **datos disponibles**, no de habilidad: la UI lo dice
  ("Cuentas con más partidas analizadas"). Revisar si algún día hay un índice de
  cuentas real (requiere producción key y otro enfoque, ADR-014).

---

## ADR-024 — Mejores/peores picks con muestra mínima y umbral de 45%

**Estado:** aceptada · **Fecha:** 2026-11-26

### Contexto
`pickHighlights` elegía "mejores" y "peores" por winrate crudo dentro de los 8
campeones más jugados. Eso producía dos ruidos clásicos:

- Un campeón con 3 partidas y 2 victorias (67%) aparecía como mejor pick, por
  encima de uno con 20 partidas y 60%.
- Un 0/1 o un 0/2 aparecía como peor pick, y la lista "No pickees más esto"
  mostraba campeones con winrate alto (50-60%) solo porque eran los siguientes
  en el orden.

Pedido del operador: en peores, priorizar campeones **muy jugados con bajo
winrate** y mostrar **solo si el WR es menor a 45%**; en mejores, evitar los que
se jugaron pocas veces y ganaron esas pocas veces.

### Opciones evaluadas
| Opción | A favor | En contra |
|---|---|---|
| Piso fijo de partidas (ej. 10) + WR crudo | simple de explicar | con historial chico vacía el panel; con historial grande deja pasar 10/10 |
| Piso relativo solo + WR crudo | escala con el volumen | un 5/5 (100%) sigue ganándole a un 20/12 (60%) |
| **Piso relativo + cota inferior de Wilson (best) + derrotas (worst)** | castiga muestra chica sin números mágicos en el orden | la cota es menos intuitiva que "WR" (la UI sigue mostrando el WR real) |

### Decisión
- **Muestra mínima** (`pickSampleFloor`): 10% de las partidas del campeón más
  jugado, con piso de 4 y techo de 20. Con 20 partidas analizadas alcanza con 4;
  con 200 en el campeón principal hacen falta 20. Un campeón con 3 partidas
  nunca entra (el caso reportado).
- **`best`** se ordena por `wilsonLowerBound(wins, games)` (95%), no por winrate:
  es el winrate del que te podés hacer cargo con esa muestra. 12/20 (60%) queda
  por encima de 3/5 (60%) y de 2/3 (67%). El WR que se muestra sigue siendo el
  real; el ajuste es solo de orden.
- **`worst`** filtra `winrate < 0.45` (estricto: 45% exacto no entra) y ordena
  por **derrotas** (`games - wins`), que es volumen × mal winrate: 40 partidas al
  40% (24 D) va antes que 10 partidas al 20% (8 D).
- `worst` se calcula **primero**: un campeón bajo 45% nunca se recomienda como
  "mejor pick" (antes se repartían y un 30% podía salir como mejor del pool).
- Ambas tarjetas muestran una aclaración al pie con la regla, y los estados
  vacíos dicen el umbral en vez de un genérico "no hay partidas".
- Las listas ya no se "reparten" cuando hay pocos campeones: si nadie llega a la
  muestra mínima o al 45%, la tarjeta queda vacía (es información, no un bug).

### Consecuencias
- `pickHighlights` es pura y sigue sin tocar `summary.champions`; el perfil no
  cambia sus requests (todo se calcula en memoria sobre el agregado).
- Costo cero en Riot/DB: no hay query nueva.
- Si un jugador tiene todo su pool bajo 45%, "Mejores picks" queda vacío: es
  correcto y la etiqueta lo explica.
- Tests en `src/lib/riot/aggregate.test.ts`: piso de muestra, 2 de 3, 45% exacto,
  orden por derrotas, no repetición entre listas.

### Corrección (2026-11-26, mismo día)
Reporte del operador: en la cuenta **AMO LAS TET4S#6293** el panel "No pickees
más esto" decía que no había ningún campeón con muestra suficiente aunque
Warwick tenía ~36% de WR. Dos causas, las dos del lado de `worst`:

1. `worst` salía del **mismo pool de 8 campeones más jugados** que `best`, así
   que un campeón con menos volumen que esos 8 nunca se miraba.
2. `worst` heredaba la **muestra relativa** (10% del más jugado, hasta 20): con
   un campeón principal de 200 partidas, se exigían 20 partidas para marcar a
   cualquiera como mal pick.

Cambios:
- **`worst` mira todo el historial**, no el pool: el orden por derrotas ya se
  encarga de priorizar a los que jugaste mucho (volumen × mal WR), así que no
  hace falta recortar candidatos antes.
- **`worst` exige un piso fijo de 5 partidas** (`MIN_WORST_GAMES`), sin la regla
  relativa. Es lo que pidió el operador: "que cuenten a partir de que haya
  jugado al menos 5 partidas".
- `best` no cambia de criterio (pool de 8 + muestra relativa + Wilson), pero su
  piso absoluto sube de 4 a 5 para que la regla sea una sola: **nunca menos de
  5 partidas**.
- El demo (`fixtures.ts`) pasa a tener Jinx 2/5 (40%) para que el modo demo siga
  mostrando el panel de malos picks con la regla nueva.
- Textos: la tarjeta de peores dice "Solo campeones con 5 partidas o más y menos
  de 45% de WR; primero los que más jugaste" y el estado vacío nombra el piso.
- Tests nuevos: mal pick fuera del top de más jugados (caso Warwick) y piso de 5
  (4 partidas no alcanzan).
