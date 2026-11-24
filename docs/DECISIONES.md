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
- [ ] Buscador con autocompletado (requiere un endpoint propio de sugerencias por
      prefijo de campeón, no de invocador — Riot no tiene search de invocadores).
- [ ] Páginas de comparación / ranking global (necesitaría Meraki `championrates`).
- [ ] Gráficos (Recharts candidato).
- [ ] Tests: unitarios del agregador + smoke test contra API real con mock de fixtures.
