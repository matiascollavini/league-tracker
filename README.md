# league-page

Estadísticas de League of Legends: buscás tu **Riot ID** y ves tus últimas 20
partidas, tu **campeón más jugado** con su winrate, y podés **filtrar por campeón**
y por cola.

Funciona hoy en **modo demo** (datos de ejemplo) y pasa a datos reales en cuanto
cargás una API key de Riot.

---

## Empezar

```bash
npm install
npm run dev          # http://localhost:3000
```

Sin key arranca en modo demo: buscá cualquier cosa (ej. `Demo#LAS`) y vas a ver
una cuenta de ejemplo con 24 partidas. Los nombres de campeones e iconos son
reales (vienen de Data Dragon).

### Con datos reales

1. Sacá una dev key en <https://developer.riotgames.com> (gratis, con tu cuenta
   de LoL). **Se vence cada 24 h**: hay que regenerarla a mano.
2. Copiá `.env.example` a `.env.local` y completá:

```bash
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
RIOT_DEFAULT_PLATFORM=la2   # la1=LAN · la2=LAS · na1 · euw1 · kr · ...
```

3. Reiniciá `npm run dev`. Verificá que la key y la cuenta funcionan:

```bash
npm run verify:riot -- "TuNombre#TAG" la2
```

Ese script corre los chequeos de `docs/API-LOL.txt` §18 (endpoints, límites,
ventana real de historial) e imprime los headers de rate limit de tu key.

---

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | server de desarrollo |
| `npm run build` / `npm start` | build y server de producción |
| `npm run typecheck` | TypeScript estricto |
| `npm run lint` | ESLint (config de Next 16) |
| `npm test` | tests unitarios del agregador y del routing (Vitest) |
| `npm run verify:riot -- "Nombre#TAG" la2` | verificación empírica contra la API real |
| `npm run ingest -- "Nombre#TAG" la2 --budget=120` | baja partidas a la base (worker) |
| `npm run db:stats` | qué hay guardado y cuánto ocupa |
| `npm run worker -- --minutes=8` | baja lo pendiente de la cola (lo que corre el cron) |
| `npm run db:migrate` | crea/migra el esquema en la base configurada |
| `npm run db:copy -- --prod` | sube la base local a Turso sin re-descargar |
| `npm run repair:names` | completa nombres faltantes en partidas viejas |

La ingesta puede correr de fondo:

```bash
nohup npm run ingest -- "Nombre#TAG" la2 --budget=1100 --pages=10 > data/ingest.log 2>&1 &
tail -f data/ingest.log      # ver el avance
npm run db:stats             # resumen cada tanto
```

---

## La base de datos (gratis)

La app guarda cada partida **una sola vez** y la reusa. Sin esto, analizar 1.000
partidas costaría ~1.011 requests por visita.

- **Local:** un archivo, `data/league.db` (SQLite). No hay que instalar nada más.
- **Producción:** [Turso](https://turso.tech) (SQLite replicado), plan free de
  **5 GB**. Solo cambia `DATABASE_URL` en las variables de entorno.

```
tablas
  matches             una fila por partida (inmutable)
  match_participants  los 10 jugadores de cada partida (campeón, K/D/A, oro, CS…)
  puuid_matches       qué partidas le corresponden a cada jugador (incluye pendientes)
  puuid_sync          cursor del backfill + lock para no duplicar trabajo
```

**Tamaño real medido:** 39 partidas = 0,12 MB → **3 KB por partida**.
Una cuenta completa (~1.000 partidas) ≈ 3 MB. Con 5 GB entran ~1.500 cuentas.

### Cargar historial

```bash
npm run ingest -- "Nombre#TAG" la2 --budget=120 --pages=3
npm run db:stats
```

`--budget` son requests permitidos y `--pages`, páginas de 100 IDs a recorrer.
Es **resumible**: si cortás, la próxima corrida sigue donde quedó. Con dev key
(100 requests / 2 min) un backfill completo tarda ~20 minutos; con production
key, ~20 segundos.

El perfil tiene un botón **"Cargar todo el historial"** que completa los últimos
2 años en tandas, con barra de progreso y sin bloquear la página (se puede cerrar
y se retoma donde quedó). Con personal key tarda ~20 min para 1.000 partidas;
con production key, ~25 segundos.

**Producción:** `docs/DEPLOY.md` (Turso + Vercel + worker en GitHub Actions,
todo gratis). Para verificar a qué base está conectado el deploy:
`/api/health`.

## Cómo está armado

```
src/
├── app/
│   ├── page.tsx                      landing + buscador
│   ├── perfil/[region]/[gameName]/[tagLine]/page.tsx   perfil (ISR 120 s)
│   └── legal/{terminos,privacidad}   páginas requeridas para la production key
├── components/                       UI (server components en su mayoría)
└── lib/
    ├── riot/
    │   ├── config.ts      plataformas ↔ clusters, colas, labels
    │   ├── http.ts        riotFetch + token bucket + reintentos + zod
    │   ├── account.ts     Riot ID → puuid, summoner, rank
    │   ├── matches.ts     ids + detalle de partidas
    │   ├── aggregate.ts   agregación por campeón (funciones puras, testeadas)
    │   ├── fixtures.ts    cuenta de demo
    │   └── types.ts       esquemas zod de las respuestas
    ├── db/                    SQLite/Turso: schema, partidas, progreso, lock
    ├── ingest.ts              backfill resumible (IDs + detalles)
    ├── profile.ts             lectura: base → sync acotado → vía directa
    └── ddragon/champions.ts   catálogo es_ES, iconos, versiones
```

Flujo de un perfil: `Riot ID → puuid → últimas N partidas → agregado por campeón`.

Decisiones de arquitectura y su porqué: **[`docs/DECISIONES.md`](docs/DECISIONES.md)**.
Referencia completa de la API: **[`docs/API-LOL.txt`](docs/API-LOL.txt)**.
Instrucciones permanentes del proyecto: **[`AGENTS.md`](AGENTS.md)**.

---

## Páginas

| Ruta | Qué muestra |
| --- | --- |
| `/` | buscador por Riot ID + región |
| `/perfil/[region]/[nombre]/[tag]` | barra lateral con rango, "Tu pool", tabla por campeón (top 8 + ver todos), reparto por rol, últimas partidas y forma reciente |
| `/partida/[matchId]?player=<puuid>` | tabla completa de los 10 jugadores de esa partida |
| `/comparar?a=<region>/<nombre>/<tag>&b=...` | comparador de dos cuentas lado a lado |
| `/legal/{terminos,privacidad}` | páginas requeridas para la production key |

## Lo que hay que tener en cuenta

1. **No existe "todas las partidas de la cuenta".** Riot devuelve como máximo las
   últimas ~1.000 (2 años de retención) y no hay endpoint de totales. Analizamos
   las últimas `RIOT_ANALYZE_COUNT` (24 por defecto, máx. 100) y la página siempre
   dice sobre cuántas partidas se calculó.
2. **Caché en tres niveles.** `fetch` con `revalidate` de Next (partidas
   inmutables: 30 días), token bucket por proceso y render cacheado 120 s. Ningún
   page view hace fan-out contra Riot.
3. **Una partida se agrupa por `championName`**, nunca por `championId`: ese
   campo es inválido en partidas anteriores al patch 11.4.
4. **Las partidas custom (`queueId 0`) se excluyen** de las estadísticas: Riot no
   permite mostrarlas públicamente sin opt-in.
5. **Para publicar hace falta una production key** (dominio verificado + ToS +
   Privacy). La dev key se vence cada 24 h y la personal no puede usarse en un
   producto público.

## Próximos pasos

- [ ] Postgres + Redis + worker de backfill para analizar hasta ~1.000 partidas
      por cuenta (y acumular historia propia).
- [ ] Página de detalle de partida.
- [ ] Comparador / gráficos (Recharts).
- [ ] Deploy en Vercel + pedido de production key.

## Aviso legal

league-page isn't endorsed by Riot Games and doesn't reflect the views or
opinions of Riot Games or anyone officially involved in producing or managing
Riot Games properties. Riot Games, and all associated properties are trademarks
or registered trademarks of Riot Games, Inc.
