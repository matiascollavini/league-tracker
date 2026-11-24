# Research: Framework + hosting for a read-only LoL stats site (state of the art, Nov 2026)

> Verified against official docs/release notes on 2026-11-23. Versions = latest stable on those pages that day.

## TL;DR

**Primary: Next.js 16.4 (App Router + Cache Components) on Vercel Hobby, with Redis (Upstash) as the Riot cache and Postgres (Neon) for durable match history.** Strongest production-proven "cache a server render, invalidate by tag" model (`'use cache'`, `cacheLife`, `cacheTag`, pluggable `cacheHandlers`), first-class shadcn/Recharts path, single Node runtime where request coalescing against a rate-limited upstream is implementable.

**Alternative: Astro 7.4 on Netlify (or Cloudflare) with React islands** — simpler filter UI (URL-driven, zero client JS), stable route caching + pluggable cache providers, cheapest per request on free tiers.

**Framework-independent:** "most-played champion across ALL matches" cannot be derived from the last-20 list. You need persistent storage + a background accumulation job regardless. Framework choice optimizes rendering/caching, not data collection.

## Frameworks

### Next.js — **16.4** (blog 6 Oct 2026; docs "Latest v16.4.6"); 16.0 on 21 Oct 2025
- **Caching:** Cache Components still opted in via config flags (`cacheComponents: true`; the 16.4 post says "two flags"). Primitives: `'use cache'` (function/module/component), `cacheLife('minutes'|'hours'|'days'|'max'|{expire})`, `cacheTag()`. Invalidation: `revalidateTag(tag, profile)` — the `cacheLife` profile argument is **required** since 16.0 for SWR; new `updateTag()` for read-your-writes in Server Actions. [next-16](https://nextjs.org/blog/next-16)
- **ISR:** `generateStaticParams` prerenders shells; unknown params render on demand into the ISR cache; `router.isFallback` is gone. [ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components)
- **16.4 additions:** `ensureStatic()` (guard a shell against accidental request-time rendering), `navigation()`/`prefetch()`, Partial Prefetching as part of the model, React 19.3. [next-16-4](https://nextjs.org/blog/next-16-4)
- **Shared cache:** `cacheHandlers` + `incrementalCacheHandlerPath` → Redis/runtime cache backing `'use cache'` across instances (same ISR guide, "Self-hosting").
- **Upstream fit:** excellent — `'use cache'` on the data module collapses N concurrent views into 1 upstream call; `cacheTag('acct:'+puuid)` gives surgical invalidation.
- **Filters:** `searchParams` (a Promise in 16) + Server Components; client components only where needed. More power, more footguns; best if you add auth/live dashboards later.
- **Vercel Hobby:** 4 CPU-hrs/mo **active CPU**, 360 GB-hrs provisioned memory, 1M invocations, 100 GB fast data transfer, 10 GB fast origin transfer; max duration 300 s, max memory 2 GB, single region (default `iad1`). [Hobby](https://vercel.com/docs/plans/hobby) · [limits](https://vercel.com/docs/functions/limitations)
- **Caveats:** active CPU is the binding constraint (~36k renders/mo at 400 ms, estimate); RSC + Cache Components is real mental-model tax; 16.x minors keep breaking signatures.

### Astro — **7.4** (15 Oct 2026); 7.0 on 22 Jun 2026, 6.0 on 10 Mar 2026
- **7.0:** route caching **stabilized**; experimental CDN cache providers (Netlify/Vercel/Cloudflare); Rust `.astro` compiler; Vite 8/Rolldown; `src/fetch.ts` advanced routing. [astro-7](https://astro.build/blog/astro-7/) · [7.4](https://astro.build/blog/astro-740/)
- **6.0:** Live Content Collections stable (request-time data loaders), CSP API, Node 22+, `@astrojs/cloudflare` rebuilt on `workerd` in dev/prerender/prod. [astro-6](https://astro.build/blog/astro-6/)
- **Rendering:** fully prerendered by default; `export const prerender = false` per route or `output: 'server'` globally. Adapters: `@astrojs/node|vercel|netlify|cloudflare`. [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- **Route caching:** `cache: { provider: memoryCache() }`, then `Astro.cache` (+ `context.cache` in endpoints) and declarative `routeRules`; HTTP semantics (`max-age`, `stale-while-revalidate`), tag/path invalidation, pluggable **Cache Provider API** (custom provider ⇒ Redis). CDN providers set `Vercel-CDN-Cache-Control`, `Netlify-CDN-Cache-Control` (durable cache), `Cloudflare-CDN-Cache-Control` + `Cache-Tag` headers — still **experimental**, enabled manually. [caching](https://docs.astro.build/en/guides/caching/)
- **Server Islands:** `<C server:defer>` + `slot="fallback"`; HTML cached aggressively, island fetched in a *second* request; can't pass functions. Needs an adapter. [server islands](https://docs.astro.build/en/guides/server-islands/)
- **Actions:** typed, Zod-validated, progressive-enhancement — for mutations, **not** filters (filters should be GET links → URL state). [actions](https://docs.astro.build/en/guides/actions/)
- **Caveats:** route caching is 5 months old; CDN providers experimental; islands add a round trip when request-time data is needed.

### SvelteKit — **3.0** (1 Oct 2026)
Config in `vite.config.ts` (no `svelte.config.js`), `$lib`→`#lib`, better env vars/service workers/errors. **Remote functions still experimental** ("Not quite. But it's our top priority!"), require Async Svelte's experimental flag. [sveltekit-3](https://svelte.dev/blog/sveltekit-3-is-here) · [remote functions](https://svelte.dev/docs/kit/remote-functions)
Server `load` + `+server.ts`; **no built-in shared/ISR cache** — bring Redis + `Cache-Control`. Great SSR perf, tiny runtime; shadcn only via community ports.

### TanStack Start — **1.0 stable** (13 Oct 2026)
Nitro-based deploy (deliberately **no adapter matrix**), `createServerFn` typed server functions callable from loaders, per-route selective SSR, ~5.5× SSR throughput work. Cache story = TanStack Query + your own store/headers; no `revalidate` primitive. [tanstack-start-1-0](https://tanstack.com/blog/tanstack-start-1-0)

### Nuxt 4 — **4.7** (23 Nov 2026); 4.0 on 15 Jul 2025
4.7: Nitro v3 opt-in, `nuxt/server`, runtime-config validation. [updates](https://nuxt.com/updates)
**Best built-in shared cache of the non-Next options:** Nitro `defineCachedFunction`/`defineCachedHandler` with `maxAge`, `swr: true`, `staleMaxAge`, storage-backed (Redis/KV) — exactly "cache this upstream call with SWR across instances". [nitro cache](https://nitro.build/guide/cache) Vue-only UI libs (Nuxt UI 4.12 has charts); no shadcn.

### React Router 7 / Remix — **7.18.6**
Framework mode: `loader`/`action`, `useNavigation` pending UI, `Cache-Control` for CDN. **RSC still unstable** (`RSCHydratedRouter🧪`). No ISR primitive; needs a Node host. Boring and minimal. [changelog](https://reactrouter.com/changelog) · [RSC](https://reactrouter.com/api/rsc/RSCHydratedRouter)

## Next.js vs Astro for THIS app

- **Filter UI:** Astro simpler. Champion filter = `<form method="get">` / `<a href="?champion=Ahri">`; server renders the filtered table; no hydration, shareable/SEO URLs free. Next does the same with `searchParams` but inherits RSC boundaries, `Suspense`, and `use client` temptation.
- **Shared cache:** Next ahead (tagged, instance-shared, `cacheHandlers`). Astro's equivalent works but is newer/partly experimental.
- **Cost/CPU:** Astro ahead — a fraction of a React render per request; comfortable under Cloudflare's **10 ms CPU/invocation free limit**, where Next.js (via `@opennextjs/cloudflare`) is not, and a 20-match fan-out would exceed it.
- **Streaming:** both; Astro = island (extra request), Next = `Suspense` in one response.
- **Verdict:** Astro if v1 is "pages + tables + one chart"; Next if you expect accounts, live refresh, instant client-side filters and one framework for 2+ years.

## Scored comparison (weights in header)

| | Upstream cache (25%) | Filter UI (20%) | Free tier (20%) | DX/ecosystem (15%) | Extensible (10%) | Perf/cold start (10%) | **Total** |
|---|---|---|---|---|---|---|---|
| **Next.js 16.4** | 9 | 8 | 7 | 9 | 10 | 8 | **8.4** |
| **Astro 7.4** | 8 | 9 | 9 | 8 | 7 | 9 | **8.4** |
| Nuxt 4.7 | 9 | 7 | 8 | 7 | 9 | 8 | **8.1** |
| SvelteKit 3.0 | 6 | 7 | 9 | 7 | 8 | 9 | **7.4** |
| TanStack Start 1.0 | 6 | 7 | 8 | 7 | 8 | 8 | **7.1** |
| React Router 7.18 | 6 | 7 | 7 | 7 | 8 | 7 | **6.8** |

Tie-break → Next.js: (a) proven tag-based shared cache, (b) shadcn/Recharts/Tailwind is first-class, (c) one Node runtime makes rate-limit token buckets + coalescing implementable.

## Recommended stack

- **Framework:** Next.js 16.4 App Router, `cacheComponents: true`; Tailwind **4.3**; shadcn/ui (charts = **Recharts v3**).
- **Charts:** shadcn `chart` (Recharts v3). uPlot only if you ever plot 1k+ points.
- **Hosting:** Vercel Hobby for v1; escape hatch **Fly.io** `shared-cpu-1x` 512 MB at **$3.69/mo** (Free plan: $5 usage/mo with card, ≤3 Machines) running `next start`. [fly pricing](https://docs.fly.io/about/pricing)
- **Data:** Upstash Redis free (**500K commands/mo, 250 MB, 10 GB**) as cache + locks; Neon/Supabase Postgres free for `matches`/`participants` + champion aggregates. Cloudflare KV free (100K reads/day, 1K writes/day) only if you move to Workers.
- **Caching topology (3 layers):**
  1. **Page/CDN:** `'use cache'` shell with `cacheLife('minutes')`; immutable match blocks `cacheLife('max')`.
  2. **Redis (the real Riot cache):** `riotId→puuid` (permanent), `matchId→match JSON` (permanent, matches immutable), `puuid→aggregate` (10–30 min TTL, `cacheTag('acct:'+puuid)`), plus `SET NX PX` lock per puuid so concurrent views collapse into one sync.
  3. **Postgres:** append-only `matches`/`participants`; aggregates in SQL; cron/queue backfills the paginated match list (never per page view), with 429/`Retry-After` back-off stored in Redis.

## Residual risks / unverified

- Vercel Hobby commercial-use wording: the Hobby docs page no longer states "non-commercial"; couldn't verify current ToS → **UNVERIFIED**, read [vercel.com/legal/terms](https://vercel.com/legal/terms) before adding ads.
- Active CPU per Next.js render (~36k renders/mo figure) is an estimate, not documented → **UNVERIFIED**.
- Cold starts (Vercel Fluid ~hundreds of ms; Fly after `auto_stop` ~1 s) are qualitative, not from docs → **UNVERIFIED**.
- Astro CDN cache providers are experimental; SvelteKit remote functions not stable → APIs may change.
- Astro's built-in memory provider is per-process (not shared across instances) — inferred from the provider model, docs don't state it → **UNVERIFIED**.

## Sources

Next.js 16 https://nextjs.org/blog/next-16 · 16.4 https://nextjs.org/blog/next-16-4 · ISR/Cache Components https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components · `use cache` https://nextjs.org/docs/app/api-reference/directives/use-cache · Vercel Hobby https://vercel.com/docs/plans/hobby · Function limits https://vercel.com/docs/functions/limitations · Astro 7 https://astro.build/blog/astro-7/ · Astro 7.4 https://astro.build/blog/astro-740/ · Astro 6 https://astro.build/blog/astro-6/ · Astro caching https://docs.astro.build/en/guides/caching/ · Server islands https://docs.astro.build/en/guides/server-islands/ · Actions https://docs.astro.build/en/guides/actions/ · On-demand rendering https://docs.astro.build/en/guides/on-demand-rendering/ · SvelteKit 3 https://svelte.dev/blog/sveltekit-3-is-here · Remote functions https://svelte.dev/docs/kit/remote-functions · TanStack Start 1.0 https://tanstack.com/blog/tanstack-start-1-0 · Nuxt updates https://nuxt.com/updates · Nitro cache https://nitro.build/guide/cache · React Router changelog https://reactrouter.com/changelog · Router RSC https://reactrouter.com/api/rsc/RSCHydratedRouter · Cloudflare Workers pricing https://developers.cloudflare.com/workers/platform/pricing/ · Netlify pricing (300 credits/mo free; 20 credits/GB; 2 credits/10k requests) https://www.netlify.com/pricing/ · Fly.io pricing https://docs.fly.io/about/pricing · Upstash Redis https://upstash.com/pricing/redis · Tailwind v4.3 https://tailwindcss.com/blog · shadcn charts (Recharts v3) https://ui.shadcn.com/docs/components/chart
