# league-page

Sitio web de estadísticas de League of Legends: buscás tu Riot ID y ves tus últimas
20 partidas, tu campeón más jugado con su winrate, y podés filtrar por campeón.

> **Estado: investigación cerrada, código sin empezar.** Este repo contiene, por
> ahora, la documentación de la API y las decisiones de arquitectura.

## Empezar por acá

| Documento | Para qué |
| --- | --- |
| [`docs/API-LOL.txt`](docs/API-LOL.txt) | Referencia completa de la API de Riot: keys, rate limits, endpoints, esquemas, gotchas, recetas de código, legal. **Es el documento de trabajo.** |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Por qué Riot y no OP.GG/U.GG, por qué Next.js, cómo se cachea. |
| [`AGENTS.md`](AGENTS.md) | Instrucciones permanentes del proyecto (idioma, método, reglas técnicas). |
| `research/` | Briefs crudos de la investigación, con todas las fuentes. |

## Stack

- **Datos:** Riot Games API oficial + Data Dragon (`es_ES`).
- **Framework:** Next.js 16.4 (App Router, `cacheComponents`), Tailwind 4, shadcn/ui.
- **Hosting:** Vercel Hobby.
- **Caché:** Upstash Redis (caliente) + Neon Postgres (histórico propio).
- **Ingest:** worker separado por cron (nunca en el request del usuario).

## Lo que hay que saber antes de tocar código

1. **No existe "todas las partidas de la cuenta".** Riot devuelve como máximo las
   últimas ~1.000 partidas (2 años de retención) y no hay endpoint de totales.
   La UI siempre muestra cuántas partidas se analizaron y el rango de fechas.
2. **Hace falta una production key para publicar.** La dev key muere cada 24 h y
   la personal no se puede usar en un producto público.
3. **Ningún page view le pega a Riot.** Todo pasa por caché/DB; el token bucket
   vive en el worker.
4. **Agrupar por `championName`**, nunca por `championId` en partidas viejas.

## Correr el proyecto (cuando exista el scaffold)

```bash
npm install
cp .env.example .env.local   # completar RIOT_API_KEY
npm run dev
```

## Aviso legal

Este proyecto no está avalado por Riot Games. League of Legends y Riot Games son
marcas registradas de Riot Games, Inc. Los datos se obtienen de la API oficial.
