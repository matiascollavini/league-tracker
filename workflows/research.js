// Research workflow: League of Legends data APIs + framework choice.
// Lanes run in parallel; results are returned as a plain-text digest.
const out = args && args.outDir ? args.outDir : "research";

const shared = `
CONTEXT
- The operator is building a public League of Legends stats site (Spanish-speaking, small solo project).
- Core features v1: search by Riot ID (gameName#tagLine) -> show last 20 matches; show the most-played champion across ALL matches in that account; winrate for that champion; filter by champion to see games played + winrate for that champion.
- Future features will be added, so the design must be extensible.
- Priority: free/near-free, official where possible, low rate-limit risk, good DX.

DELIVERABLE RULES
- Be dense and factual. Prefer primary sources (official docs) and cite the exact URLs you used.
- Include concrete details: exact endpoint paths, parameter names, example requests, auth headers, limits, error codes, response field names, dates of the docs, deprecations.
- Note explicitly anything you could not verify (do not invent). Mark unverified claims as "UNVERIFIED".
- Write in ENGLISH (the parent will translate the final artifact to Spanish).
- Max ~1400 words. Use headings + bullets + small code/JSON snippets. No filler.
`;

const riotCore = {
  key: "riot-core",
  label: "Research Riot official API surface",
  agent: "web-research",
  output: out + "/01-riot-core.md",
  task: shared + `
TASK: Map the OFFICIAL Riot Games API for a League of Legends stats site.
Cover:
1. Developer portal + account/key lifecycle: how to register, Development key vs Personal vs Production (Registration) key, what the production-key application requires (product description, screenshots, rate-limit justification, VOD/policy requirements), typical approval time, and whether a hobby site can get one. Exact URLs (developer.riotgames.com).
2. Current key types and their RATE LIMITS as of today (dev key: e.g. 20 req/s, 100 req/2min — verify), per-region vs global limits, 429 + Retry-After + X-Rate-Limit-* headers, and the "method rate limit" nuances.
3. Every endpoint this product v1 needs, with routing:
   - ACCOUNT-V1 (Riot ID -> puuid; note the 2023 Summoner Name -> Riot ID migration; regional routing values americas/asia/europe/sea/esports).
   - SUMMONER-V4 (still needed? profileIconId, summonerLevel).
   - MATCH-V5 (ids by puuid, match detail; which cluster to use — regional routing, not platform).
   - CHAMPION-MASTERY-V4 (useful for "most played" alternative).
   - LEAGUE-V4 (rank, optional).
   - Data Dragon: versioning (versions.json, champion.json, ddragon cdn URLs), how to map championId -> name/image, locale support (es_ES), and CommunityDragon for extras.
   - Platform routing values (la1, la2, na1, euw1, kr, br1, ...) and which endpoints need platform vs regional host.
4. Response schemas in detail for: account-v1 by-riot-id, summoner-v4 by-puuid, match-v5 ids, match-v5 match detail (info.participants fields relevant to per-champion stats: championId, championName, win, kills/deaths/assists, teamPosition, queueId, gameCreation/gameDuration; info.gameMode/queueId/gameVersion; metadata.matchId), and champion-mastery.
5. Error codes (400/401/403/404/415/429/500/503) and their meaning, plus the common gotcha cases (404 for unranked/never-played, 403 for expired dev key).
6. Riot API policies/legal: rate-limit compliance, caching rules, "no monetization of data"/commercial-use terms, required attribution, privacy policy requirement, prohibition on offering an API to third parties, data retention rules. Quote or closely paraphrase the policy sections and link them.
7. Ecosystem facts worth knowing: Riot ID format rules, PUUID is per-cluster/per-game, region vs cluster, API versioning/season resets, deprecation policy.
Return findings only; no preamble.
`,
};

const riotLimits = {
  key: "riot-history",
  label: "Research full match history + caching math",
  agent: "web-research",
  output: out + "/02-riot-history-caching.md",
  task: shared + `
TASK: Solve the hardest data problem of this product: "most-played champion across ALL matches in an account" under Riot rate limits, and the caching/architecture needed.
Cover:
1. MATCH-V5 by-puuid semantics: allowed start/count ranges, the 100-entry page size, the hard cap on how far back match IDs can be enumerated (there is a documented limit around the most recent 1000 matches for by-puuid — VERIFY the exact wording and value and where it is documented), beginTime/endTime/startTime/queue/type/start/count parameters, and what happens past the cap.
2. Whether Riot exposes ANY "total games played" / lifetime stats for a player (Riot API, League client endpoints, or 3rd-party). State clearly what is and is not available.
3. Practical algorithms + cost math: paginating 1000 match IDs (10 requests of 100) + fetching N match details (1 request per match) = requests per user profile load; how to cache match details globally by matchId (shared across users, immutable data), how to cache per-puuid aggregates, TTLs, and how to do incremental "new matches only" refresh. Include realistic numbers for 20 recent matches vs full-history aggregate, and dev-key vs production-key feasibility.
4. Rate-limit engineering: token buckets, per-method limits, 429/Retry-After, 429 backoff, key rotation via a pool of dev keys (and whether that violates ToS), single-flight/dedup, queueing background jobs, and why you must never fan out N requests per page view.
5. Caching architecture options with free tiers: Vercel Data Cache / "use cache" / ISR, Next.js fetch revalidate, Upstash Redis free tier limits, Cloudflare KV/D1/Hyperdrive, SQLite/Turso, Postgres (Neon/Supabase) free tiers, and a background worker (cron/GitHub Actions/Vercel cron). Recommend the simplest robust stack for a hobby project with 1 dev.
6. Third-party fallbacks for full history: DeepLoL, OP.GG, U.GG, Mobalytics, LeagueOfGraphs, lolalytics — do any expose per-account full match history programmatically? Note ToS risk of scraping. Mark UNVERIFIED where applicable.
Return findings only; no preamble.
`,
};

const alternatives = {
  key: "alternatives",
  label: "Compare third-party LoL data APIs",
  agent: "web-research",
  output: out + "/03-alternatives.md",
  task: shared + `
TASK: Compare FREE (or free-tier) APIs/data sources for League of Legends player + match data, as alternatives or complements to the official Riot API.
For EACH candidate give: what it is, base URL, auth model (key/OAuth/none), free-tier limits and pricing, data coverage (matches, per-champion stats, ranked, aggregate stats), reliability/stability, official vs unofficial, ToS/legal risk, and a 1-line verdict for this project.
Candidates (add others you find):
- Riot official API (baseline for comparison).
- DeepLoL API (deeplol.gg) — free? rate limits?
- OP.GG API / op.gg internal endpoints.
- U.GG, Mobalytics, LeagueOfGraphs, lolalytics (any public/free API?).
- Riot's LoL Esports API / Leaguepedia (Cargo) — note it is pro-play only.
- CommunityDragon / Data Dragon / Meraki Analytics CDN (static assets & champion data).
- Others: e.g. "RiotWatcher"/"cassiopeia" Python libs, "henrikdev" (Valorant, for reference), apex/legend APIs, "lol-api" projects on RapidAPI.
Also cover: legality of scraping unofficial endpoints, whether sites like OP.GG/U.GG forbid it in robots/ToS, and the practical failure modes (Cloudflare, changing endpoints).
End with a comparison table (name | official? | free tier | key? | matches | per-champ stats | risk | verdict) and a clear recommendation: official Riot API as core + which (if any) 3rd party as complement.
Return findings only; no preamble.
`,
};

const framework = {
  key: "framework",
  label: "Compare frameworks and hosting for data-heavy pages",
  agent: "web-research",
  output: out + "/04-framework.md",
  task: shared + `
TASK: Recommend the best framework + hosting for THIS app, using current (latest stable) information.
App shape: mostly read-only server-rendered pages; one search box; profile page per Riot ID that calls a rate-limited upstream API; needs shared server-side caching (upstream data is immutable per match, aggregates change); moderate traffic; optional public shareable URLs/SEO; single developer; free-tier hosting preferred.
Cover for EACH of: Next.js (App Router, latest version — cacheComponents/"use cache", streaming, Server Actions, ISR), Astro (server islands, actions, on-demand routes, adapter matrix), SvelteKit (load functions, remote functions), TanStack Start, Nuxt 4, and React Router 7 / Remix. Add any other strong 2025/2026 option you find.
For each: current stable version + date, data-fetching/caching primitives, how well it fits "rate-limited upstream + shared cache", partial/streaming render, DX, ecosystem for Tailwind/shadcn, deployment targets and their free-tier limits (Vercel Hobby, Cloudflare Workers/Pages, Netlify, Fly), cold starts, and concrete performance caveats.
Then: a scored comparison table and a single primary recommendation with justification, plus one alternative if the primary's tradeoff matters to this operator. Explicitly compare Next.js vs Astro for THIS use case (server-side data + caching + interactivity for filters) — including which one makes the filter/champion-stat UI simpler.
Also recommend the pragmatic full stack: framework, styling, data layer (Redis/Postgres), charts lib, deployment, and the caching topology (where the Riot cache lives).
Cite exact URLs and version numbers. Return findings only; no preamble.
`,
};

const results = await runs.all([riotCore, riotLimits, alternatives, framework]);

const digest = results
  .map((r) => "=== " + r.key + " ok=" + r.ok + " err=" + (r.error || "-") + " len=" + String((r.output || "").length) + " ===\n" + (r.output || "(no output)"))
  .join("\n\n");

return digest;
