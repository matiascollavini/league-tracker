# research/crawled — fuentes crudas (crawl4ai)

Páginas tal como las bajaron los agentes `web-research` (Exa + crawl4ai) el
**2026-11-24**. Están acá como respaldo verificable de cada afirmación de
`docs/API-LOL.txt` y `docs/DECISIONES.md`: si un número o una cita parece
sospechosa, se busca el texto original acá antes de tocar el documento.

Son ~3 MB de Markdown generado automáticamente. Si algún día molesta, se puede
borrar entero (`git rm -r research/crawled`) sin afectar la documentación: los
números y citas ya están consolidados en `docs/`.

## Fuentes que importan (verificadas a mano además)

Oficiales de Riot:
- `developer-riotgames-com/https-developer-riotgames-com-docs-portal.md` — keys, rate limits, response codes
- `developer-riotgames-com/https-developer-riotgames-com-docs-lol.md` — routing, Data Dragon, política de la API (incluye "data broker")
- `developer-riotgames-com/https-developer-riotgames-com-policies-general.md` — General Policies (boilerplate, monetización)
- `developer-riotgames-com/https-developer-riotgames-com-terms.md` — API Terms
- `developer-riotgames-com/https-developer-riotgames-com-docs-faqs.md` — multi-app / límites
- `www-riotgames-com/...match-history-retention-change.md` — retención 3 → 2 años (2019)

Tope de 1.000 partidas (no está en la doc oficial):
- `github-com/https-github-com-riotgames-developer-relations-issues-957.md`
- `github-com/https-github-com-riotgames-developer-relations-issues-1008.md`

Framework (nov-2026):
- `nextjs-org/…next-16*.md`, `…use-cache.md`, `…incremental-static-regeneration-cache-components.md`
- `astro-build/…`, `docs-astro-build/…` (caching, server islands, actions)
- `svelte-dev/…`, `tanstack-com/…`, `nuxt-com/…`, `nitro-build/…`, `reactrouter-com/…`

Free tiers:
- `vercel-com/…hobby.md`, `…functions-limitations.md`
- `upstash-com/…pricing-redis.md`, `neon-com/…pricing.md`, `supabase-com/…pricing.md`
- `turso-tech/…pricing.md`, `developers-cloudflare-com/…kv|d1|pricing…`
- `docs-github-com/…trigger-workflows.md` (cron mínimo 5 min)

Terceros descartados (evidencia de por qué):
- `op-gg/…`, `www-op-gg/…`, `u-gg/robots-txt`, `deeplol-gg/…`, `www-leagueofgraphs-com/robots-txt`,
  `lolalytics-com/robots-txt`, `help-op-gg/…`
