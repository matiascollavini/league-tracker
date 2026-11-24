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

---

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
    └── ddragon/champions.ts   catálogo es_ES, iconos, versiones
```

Flujo de un perfil: `Riot ID → puuid → últimas N partidas → agregado por campeón`.

Decisiones de arquitectura y su porqué: **[`docs/DECISIONES.md`](docs/DECISIONES.md)**.
Referencia completa de la API: **[`docs/API-LOL.txt`](docs/API-LOL.txt)**.
Instrucciones permanentes del proyecto: **[`AGENTS.md`](AGENTS.md)**.

---

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
