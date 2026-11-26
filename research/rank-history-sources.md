# Fuentes de historial de rango / LP (League of Legends)

**Fecha de consulta de todas las fuentes: 2026-11-26.** Todo lo que sigue sale de la
referencia oficial de Riot o queda marcado como `UNVERIFIED`.

## Veredicto (3 líneas)

La Riot Games API **no tiene ningún endpoint de historial de rango/LP**: `LEAGUE-V4`
expone solo el estado *actual* (y ni siquiera devuelve un timestamp), y `MATCH-V5` no
trae tier ni LP por partida.
Por lo tanto **no existe backfill real y legítimo** de la progresión de un jugador:
lo único posible son **snapshots propios desde hoy** (1 request por jugador por
snapshot), con un gráfico que empieza el día que arranca el tracker.
La única fuente que sí tiene un "league history" es el **League Client (LCU)**, que
Riot declara *no soportado*, es local a la máquina del jugador y no sirve para
historial de terceros.

---

## 1. ¿Hay endpoint oficial de historial de rango? — **NO**

Leí la referencia oficial renderizada de `league-v4`. Contiene **exactamente cinco
operaciones**, ninguna de ellas histórica ([developer.riotgames.com/apis#league-v4](https://developer.riotgames.com/apis#league-v4)):

| Método | Ruta | Descripción oficial |
| --- | --- | --- |
| GET | `/lol/league/v4/challengerleagues/by-queue/{queue}` | "Get the challenger league for given queue." |
| GET | `/lol/league/v4/entries/by-puuid/{encryptedPUUID}` | "Get league entries in all queues for a given puuid" |
| GET | `/lol/league/v4/entries/{queue}/{tier}/{division}` | "Get all the league entries." |
| GET | `/lol/league/v4/grandmasterleagues/by-queue/{queue}` | "Get the grandmaster league of a specific queue." |
| GET | `/lol/league/v4/masterleagues/by-queue/{queue}` | "Get the master league for given queue." |

Puntos que importan:

- **No hay `by-summoner`.** La versión actual solo lista `entries/by-puuid`. La
  migración a Riot ID (2023-11-20) dejó los endpoints por nombre/summoner como
  deprecados ([docs/lol#summoner-names-to-riot-ids](https://developer.riotgames.com/docs/lol)).
- **No existe nada tipo `league history` / `ranked history` / `mmr`.** El listado
  completo de APIs de LoL en el portal es: `champion-mastery-v4`, `champion-v3`,
  `clash-v1`, `league-exp-v4`, `league-v4`, `lol-challenges-v1`, `lol-rso-match-v1`,
  `lol-status-v4`, `match-v5`, `spectator-v5`, `summoner-v4`,
  `tournament-stub-v5`, `tournament-v5` ([developer.riotgames.com/apis](https://developer.riotgames.com/apis)).
  Ninguna devuelve progresión de tier/división/LP.
- **`LEAGUE-EXP-V4` tampoco ayuda:** su única operación es
  `/lol/league-exp/v4/entries/{queue}/{tier}/{division}` (paginado), o sea una foto
  del presente por página.
- **Prueba estructural de que es estado actual y no historia:** el `LeagueEntryDTO`
  tiene `leagueId`, `puuid`, `queueType`, `tier`, `rank`, `leaguePoints`, `wins`,
  `losses`, `hotStreak`, `veteran`, `freshBlood`, `inactive`, `miniSeries`. **No hay
  ningún campo de fecha, temporada ni `timestamp`** en el DTO. Sin timestamp no hay
  serie temporal: cada respuesta es un punto que hay que fechar del lado del cliente.
- **`miniSeries` está obsoleto en la práctica:** sigue en el DTO pero la promoción por
  series se eliminó del juego en 2023; el campo viene vacío/ausente. *(Esto último lo
  sé por el estado del juego, no por un documento de Riot citado acá → tratarlo como
  contexto, no como cita.)*
- En el issue tracker oficial de DevRel busqué `"rank history"`, `"LP history"`,
  `"league history"` y `"ranked history"`: **no hay ningún feature request de
  historial de rango para LoL** ([issues](https://github.com/RiotGames/developer-relations/issues)).
  Es decir: ni existe, ni está anunciado.

## 2. ¿MATCH-V5 trae LP ganado/perdido o el tier de la partida? — **NO**

Verifiqué la referencia oficial de `match-v5` ([apis#match-v5](https://developer.riotgames.com/apis#match-v5)),
cuyas cuatro operaciones son `matches/by-puuid/{puuid}/ids`, `matches/{matchId}`,
`matches/{matchId}/timeline` y `matches/replays`.

Resultado de revisar la tabla completa de campos del `MatchDto` → `ParticipantDto`:

- Las cadenas **`leaguePoints` y `tier` aparecen 0 veces** en toda la página de
  referencia.
- El único campo que puede confundir es **`placement`** (int) del `ParticipantDto`,
  que es la **posición en Arena/TFT**, no la división de ranked. No sirve como proxy
  de elo.
- Lo que sí trae `MatchInfoDto`: `queueId`, `gameVersion`, `gameStartTimestamp`,
  `gameEndTimestamp`, `gameDuration`, `platformId`, etc. — es decir, se puede saber
  *qué* cola era, pero no cuánto LP costó.

**Consecuencia:** no se puede reconstruir LP retroactivamente desde las partidas
guardadas. Lo máximo reconstruible es "racha de V/D por cola", no "+23 LP".

## 3. ¿Cómo construye dpm.lol el gráfico de progresión de LP? — `UNVERIFIED`

No encontré **ninguna** declaración pública del equipo sobre esto. Lo que revisé y
lo que dice:

- **Changelog oficial** ([dpm.lol/changelog](https://dpm.lol/changelog)): 30k caracteres
  de entradas; la única mención a LP es del **app de escritorio**, no de la web:
  > "The end of game screen shows LP instead of the division for Master and above."
  Es decir, el *overlay de fin de partida* sí conoce el delta de LP de la partida que
  acaba de terminar. Eso es consistente con leerlo del cliente local o de un snapshot
  inmediato, pero **no lo dicen**.
- **FAQ** ([dpm.lol/faq](https://dpm.lol/faq)): preguntas sobre Leaderboards, Webbot,
  Premium, DPM Lens y "MyPage" (vincular cuentas alt). **Nada** sobre historial de
  rango ni cómo se calcula.
- **`llms.txt`** ([dpm.lol/llms.txt](https://dpm.lol/llms.txt)): describe el perfil
  como "rank, match history, champion pool, win rates, and performance trends". La
  palabra "trends" es lo más cerca que están de admitir una serie temporal, y no
  explica la fuente.
- **Nota de prensa/perfil** ([esports.gg, enero 2026](https://esports.gg/news/league-of-legends/how-dpm-lol-is-transforming-lol-analytics/)):
  entrevista al CEO; habla de transparencia y de validar datos con jugadores, **cero**
  detalle técnico de ingestión.
- No pude abrir un perfil real: `dpm.lol/<región>/<Nombre-TAG>` devuelve **403 de
  Cloudflare** por `curl`, y con crawl4ai solo devuelve el shell de la SPA. La única
  página de jugador que sí cargó (`/pro/Faker`) es de esports, sin sección SoloQ con
  gráfico.

**Conclusión honesta:** no hay evidencia pública de si guardan snapshots propios o si
lo sacan del cliente/app. Por la sección 1 (no existe endpoint de historia) la única
vía técnicamente posible es **snapshot propio** o **LCU/app**, pero atribuirle una u
otra a dpm.lol sería especulación. `UNVERIFIED`.

## 4. Fuentes de "backfill" de rango: qué existe y en qué estado

### 4.1 API oficial de Riot → nada (ver §1 y §2)

Como contraste ilustrativo: incluso para **VALORANT**, donde sí hay un `val-ranked-v1`,
ese API **solo expone leaderboards** (`/val/ranked/v1/leaderboards/by-act/{actId}`), no
el RR de un puuid cualquiera
([apis#val-ranked-v1](https://developer.riotgames.com/apis#val-ranked-v1)). Hay un
feature request abierto pidiendo justamente eso, sin respuesta de Riot, donde el autor
cuenta que la única salida es **cachear los leaderboards cada 10 minutos**
([issue #922, 2024-05-06](https://github.com/RiotGames/developer-relations/issues/922)).
Es el mismo patrón que en LoL: si querés rank en el tiempo, lo construís vos.

### 4.2 League Client API (LCU) — **existe, es local y Riot no lo soporta**

Sí hay endpoints de rango en el cliente, y entre ellos **uno llamado `league-history`**.
Documentación comunitaria del propio front-end del cliente (`rcp-fe-lol-leagues`)
lista ([leonkraim.github.io — rcp-fe-lol-leagues](https://leonkraim.github.io/rcp-fe-lol-documentation-26.09/plugins/rcp-fe-lol-leagues/)):

| Endpoint LCU | Descripción |
| --- | --- |
| `/lol-ranked/v1/current-ranked-stats` | Current ranked stats |
| `/lol-ranked/v1/ranked-stats` | All ranked stats |
| `/lol-ranked/v1/league-history` | League history |
| `/lol-ranked/v1/promotion-progress` | Promotion series progress |

Estado real de esto:

- **No es documentación de Riot.** Es ingeniería inversa del bundle del cliente; el
  schema autoritativo lo sirve el cliente localmente (Swagger en `127.0.0.1`), así que
  **la forma exacta de la respuesta de `league-history` queda `UNVERIFIED`**.
- **Riot lo declara fuera de soporte, textual:**
  > "This service is not officially supported for use with third party applications."
  > "We provide no guarantees of full documentation, service uptime, or change
  > communication for unsupported services."
  ([docs/lol#league-client-api](https://developer.riotgames.com/docs/lol#league-client-api))
- **Requiere que el jugador tenga el cliente abierto y autenticado en esa máquina.**
  No hay forma de pedirle el historial a otro jugador desde un servidor. No sirve como
  backfill de un sitio público.
- Riot además pide declarar en el portal qué endpoints del cliente usás
  ("we need to know about it… which endpoints you're using", misma página). Usarlo en
  silencio es justo lo que la política intenta evitar.

### 4.3 Terceros (op.gg, u.gg, deeplol…)

- **No hay declaración pública de ninguno** de cómo arma la serie de LP. `UNVERIFIED`.
- Pero es **forzoso por construcción**: como Riot no entrega historia (§1), cualquier
  gráfico de LP histórico de un jugador se alimenta de **snapshots propios** tomados
  por el sitio (o de datos del app/cliente cuando el usuario lo instala). No existe un
  proveedor oficial alternativo que revenda eso.
- Y ojo con la vía "scrapear op.gg": op.gg aclara que los datos que usa "is not
  provided to third parties" y que, aunque en general no prohíbe el crawling, restringe
  el uso excesivo ([help.op.gg](https://help.op.gg/hc/en-us/articles/31091405109401-Can-I-use-OP-GG-data)).
  No es una fuente legítima para un producto.

## 5. Rate limits relevantes para snapshots periódicos

Fuente primaria: [docs/portal#rate-limiting](https://developer.riotgames.com/docs/portal).

- **Personal / development key:**
  > "20 requests every 1 second" · "100 requests every 2 minutes"
  → **0.83 req/s sostenidos**. Y "You may not run your application for public
  consumption using a personal key… public consumption includes open alpha/beta tests."
- **Production key (inicial):**
  > "500 requests every 10 seconds" · "30,000 requests every 10 minutes"
  → **50 req/s**.
- **Los límites se aplican por región**, y además hay **app**, **method** y **service**
  limits. Los de método (los que importan si martillás un solo endpoint) **no están
  publicados**: "While it is our policy not to reveal the specifics of how our rate
  limiting works…" → hay que leerlos de `X-Method-Rate-Limit` /
  `X-Method-Rate-Limit-Count` y respetar `Retry-After` en 429.
- **Tope contractual extra para dev keys** (más estricto o al mismo nivel que el portal):
  > "A Development Key shall not be permitted to make more than ten (10) network calls
  > every ten (10) seconds."
  ([API Terms](https://developer.riotgames.com/terms), última actualización 2013-12-09).
  Contradice en parte al portal (20/1s + 100/2min); diseñar al más conservador.

**Costo real de un snapshot de rango:** `entries/by-puuid/{puuid}` devuelve **todas las
colas en una sola llamada**, así que un snapshot de N jugadores = **N requests**
(no N×colas). Con eso:

| Escala | Dev key (0.83 rps) | Prod key (50 rps) |
| --- | --- | --- |
| 1.000 jugadores | ~20 min | ~20 s |
| 10.000 jugadores | ~3 h 20 min | ~3,3 min |

Conclusión operativa: **el snapshot de rango es baratísimo comparado con el ingest de
partidas** (que necesita 1 request por partida). Es perfectamente viable un cron diario
o cada 6 h por jugador seguido, incluso con la key de producción arrancando de cero.

---

## Sources

**Mantenidas (primarias)**

- Riot — referencia `league-v4` (5 operaciones, DTOs sin timestamp):
  https://developer.riotgames.com/apis#league-v4
- Riot — referencia `league-exp-v4` (solo entries paginado): https://developer.riotgames.com/apis#league-exp-v4
- Riot — referencia `match-v5` (sin `tier` ni `leaguePoints` en `ParticipantDto`):
  https://developer.riotgames.com/apis#match-v5
- Riot — listado completo de APIs (no hay API de rango/MMR): https://developer.riotgames.com/apis
- Riot — `docs/lol`, sección **League Client API** (texto de "not officially supported"):
  https://developer.riotgames.com/docs/lol#league-client-api
- Riot — `docs/lol`, migración a Riot ID / deprecación de endpoints por nombre:
  https://developer.riotgames.com/docs/lol#summoner-names-to-riot-ids
- Riot — `docs/portal`, Rate Limiting (20/1s + 100/2min · 500/10s + 30.000/10min, por región):
  https://developer.riotgames.com/docs/portal#web-apis_rate-limiting
- Riot — API Terms (tope de 10 calls/10 s para dev keys): https://developer.riotgames.com/terms
- Riot DevRel issue tracker — #922 (no hay ranked rating por puuid; se resuelve cacheando
  leaderboards): https://github.com/RiotGames/developer-relations/issues/922
- dpm.lol — Changelog (única mención a LP: overlay del app de escritorio): https://dpm.lol/changelog
- dpm.lol — `llms.txt` y FAQ (sin detalle de fuente de datos de rango):
  https://dpm.lol/llms.txt · https://dpm.lol/faq
- OP.GG Help — uso de datos ("not provided to third parties", política de scraping):
  https://help.op.gg/hc/en-us/articles/31091405109401-Can-I-use-OP-GG-data

**Mantenidas (secundarias, marcadas como tales)**

- Documentación comunitaria del front-end del cliente — lista `/lol-ranked/v1/league-history`:
  https://leonkraim.github.io/rcp-fe-lol-documentation-26.09/plugins/rcp-fe-lol-leagues/
  *(ingeniería inversa, no Riot; el schema autoritativo es local)*
- esports.gg — entrevista al CEO de dpm.lol (contexto, cero detalle técnico):
  https://esports.gg/news/league-of-legends/how-dpm-lol-is-transforming-lol-analytics/

**Descartadas**

- `u.gg/faq` — Cloudflare JS challenge, no se pudo leer.
- `dpm.lol/<región>/<Nombre-TAG>` y `/pro/Faker` vía `curl` — 403 de Cloudflare; el
  render vía crawl4ai solo devuelve el shell de la SPA.
- Blogs/agregadores tipo "loldb.info", "agatasmurf.com", "mobalytics how to track LP" —
  contenido SEO sin fuente primaria ni afirmaciones verificables sobre la API.
- `docs.yasuo.gg`, `pulsefire`, `docs.rs/riven`, `league-sdk` — mirrors de SDKs, repiten
  la spec sin aportar nada sobre historia.
- `riot-api-update-190417` (Positional Ranking Deprecation, 2019) — histórico sobre
  ranking posicional, no sobre historial de LP; irrelevante para la pregunta.

---

## Gaps / UNVERIFIED

1. **`UNVERIFIED` — dpm.lol:** no hay ninguna declaración pública sobre cómo arma la
   serie de LP del perfil. Bloqueado por Cloudflare y por ser SPA. Si hace falta
   cerrarlo: preguntar en su Discord (https://discord.gg/VaSgg4eEpN) o mirar el
   network tab al abrir un perfil con DevTools.
2. **`UNVERIFIED` — respuesta de `/lol-ranked/v1/league-history` (LCU):** conozco el
   nombre del endpoint por documentación comunitaria, no su schema ni su rango de
   profundidad. Se verifica solo con el cliente abierto (`GET https://127.0.0.1:<port>/lol-ranked/v1/league-history`
   con auth local). No lo recomiendo igual: es no soportado y local-only.
3. **`UNVERIFIED` — método de op.gg / u.gg / deeplol:** no hay declaración pública;
   la conclusión "snapshots propios" es deducción a partir de la ausencia del endpoint
   oficial, no una cita.
4. **No verificado:** si algún día existió un `league-v4` con `by-summoner` y cuándo se
   removió exactamente; la referencia actual solo muestra `by-puuid`.
5. **Siguiente paso sugerido para el feature:** diseñar la tabla de snapshots
   (`puuid, queueType, tier, rank, leaguePoints, wins, losses, capturedAt`) con un
   índice único por `(puuid, queueType, capturedAt)` y capturar en el mismo cron que ya
   corre el ingest. El gráfico debe rotular siempre "desde <fecha del primer snapshot>",
   igual que hoy se rotula "N partidas analizadas" por el tope de ~1.000 partidas.
