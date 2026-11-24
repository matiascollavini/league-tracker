# Research: "Most-played champion across ALL matches" — match-v5 limits, cost math, caching & rate limits

## Summary
Riot's API **cannot enumerate more than the most recent ~1,000 matches per player** (and never more than 2 years back). That cap is *not* in the official docs — it is stated by Riot DevRel staff in the public `RiotGames/developer-relations` tracker. The feature is therefore impossible as specified; redefine it as "across the last ≤1,000 retrievable matches" and label it in the UI. The rest is tractable: cache match details globally by `matchId` (immutable), keep per-puuid aggregates in a DB, and issue all Riot calls from one background worker behind a token bucket — never from a page view.

---

## 1. MATCH-V5 `by-puuid/ids` semantics (verified)

```
GET https://{americas|europe|asia|sea}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids
    ?start=0&count=100&startTime=&endTime=&queue=&type=
Header: X-Riot-Token: <API_KEY>
```
Regional hosts (not platform): `americas|asia|europe|sea.api.riotgames.com`.

| Param | Doc text (verbatim) |
|---|---|
| `startTime` / `endTime` (long, epoch s) | "The matchlist started storing timestamps on June 16th, 2021. Any matches played before June 16th, 2021 won't be included in the results if the startTime filter is set." |
| `queue` (int) / `type` (enum `ranked`,`normal`,`tourney`,`tutorial`) | mutually inclusive: "any match ids returned must match both the queue and type filters" |
| `start` (int) | **"Defaults to 0. Start index."** — no documented upper bound |
| `count` (int) | **"Defaults to 20. Valid values: 0 to 100."** |

- **Page size hard-capped at 100** → full window = `ceil(1000/100)` = **10 requests** (11 if you probe for the end).
- **The 1,000 cap, exact wording** (Riot DevRel `bangingheads`, [issue #957, 2024-07-14](https://github.com/RiotGames/developer-relations/issues/957#issuecomment-2227603951)):
  > "Match data is retained for 2 years, match timelines for 1 year. A player's match list will only show up to the last 1000 matches played. Non-public games (customs, practice tool, etc.) count towards the 1000 match limit so it may never hold exactly 1000. Games exceeding the limit but not exceeding the retention period will only be accessible through the match list of another player that participated in the game, or directly by the match id."
- Repeated in [issue #1008](https://github.com/RiotGames/developer-relations/issues/1008): "Only the last 1000 matches are stored… This also includes custom games."
- **Not in the docs:** grepping the full text of `https://developer.riotgames.com/docs/lol` returns **zero** occurrences of "1000 matches" or any retention window. The only primary-source retention statement is the blog post [Match History Retention Change, 2019-07-08](https://www.riotgames.com/en/DevRel/match-history-retention-Change): three years → two years "on a rolling cadence"; timelines stay at 1 year.
- **Past the cap:** `start` beyond the available count returns `200 []`, no error (`404 "Data not found"` only for a puuid with no matches). Players routinely see 300–950 usable IDs: customs/remakes occupy cap slots and stale IDs linger with no retrievable match file.
- **Matches beyond the cap stay fetchable by ID** (within 2 years) via `GET /lol/match/v5/matches/{matchId}` — the only crack, and it needs an ID from another participant's list.

## 2. Any "total games played" / lifetime stats? — **No.**

- **`CHAMPION-MASTERY-V4`** `/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}` → `championId, championLevel, championPoints, lastPlayTime, chestGranted, tokensEarned, milestoneGrades…`. **No games-played field** (verified against the generated OpenAPI schema).
- **`LOL-CHALLENGES-V1`** `/lol/challenges/v1/player-data/{puuid}` → per-challenge `value/level/percentile/position`; some `value`s are cumulative counters but no documented challenge equals lifetime games. **UNVERIFIED.**
- **`LEAGUE-V4`** → `wins`/`losses` per queue, **current season only**. **`SUMMONER-V4`/`ACCOUNT-V1`** → no play counts. **Third-party sites** → don't resell Riot data (§6).
- **League Client API (LCU)** → local-only, explicitly unsupported: "not officially supported for use with third party applications… no guarantees of full documentation, service uptime, or change communication" ([docs/lol#league-client-api](https://developer.riotgames.com/docs/lol#league-client-api)). Needs the player's own client running.

**Product consequence:** always render `partidasAnalizadas` + covered date range, e.g. *"Campeón más jugado — últimos N partidas (máx. 1.000, límite de la API de Riot)"*.

## 3. Algorithms + cost math

- `by-puuid/ids`: 1 req per ≤100 IDs. `matches/{matchId}`: **1 req per match**.

| Scenario | Cold | Warm |
|---|---|---|
| Riot ID → puuid (`/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`) | 1 | 0 (permanent) |
| "Last 20 matches" profile load | 1 + 1 + 20 = **22** | 0 |
| Incremental refresh, 3 new games | 1 + 3 = **4** | — |
| Full backfill to the cap | 1 + 10 + 1000 = **1,011** | 0 |
| Same player opened by a 2nd user | 1 (ids) + 0 new details | 0 |

**Sustained throughput is the real blocker.** Personal/development key: 20 req/1 s **and** 100 req/2 min → **0.83 rps** sustained: 1,011 requests ≈ **20 min**, a 22-request load ≈ 26 s. Production key: 500 req/10 s + 30,000 req/10 min → **50 rps**: backfill ≈ 20 s. Hence **a dev/personal key cannot power a public site** — "You may not maintain a public product with a development API key… public consumption includes open alpha/beta tests", and dev keys **deactivate every 24 hours** ([docs/portal](https://developer.riotgames.com/docs/portal)).

**Three cache layers:**

1. **Match details — global, keyed by `matchId`, immutable.** Insert-once. `payload` holds all 10 participants (`metadata.participants`, `info.participants[].puuid`), so persisting participants gives cross-user reuse for free.
2. **Per-puuid aggregates:**
   - `matches(match_id TEXT PK, region, game_start_ts, queue_id, game_version, payload JSONB, fetched_at)`
   - `puuid_matches(puuid, match_id, PK(puuid, match_id))` ← guarantees idempotent increments
   - `champion_stats(puuid, champion_id, games, wins, PK(puuid, champion_id))`
   - `puuid_sync(puuid PK, last_synced_at, oldest_match_ts, backfill_state ENUM(none|running|done|partial), ids_cursor)`
3. **Page-level HTTP cache** (60–300 s).

**TTLs:** match detail ∞ · `puuid_matches` ∞ · aggregates 30 min soft · ids page 0: 5–15 min · account→puuid ∞.

**Incremental refresh — the only path a page view may touch:**
```
load(puuid):
  if puuid_sync.last_synced_at > now-30min: return cached aggregate   # 0 Riot calls
  ids = GET by-puuid/ids?start=0&count=20                              # 1 call
  new = ids - SELECT match_id FROM puuid_matches WHERE puuid=…         # 0 calls
  for id in new (sequential, respect bucket): m = GET /matches/{id}    # k calls
      store match; upsert champion_stats; insert puuid_matches
  last_synced_at = now
```
Deep backfill (`start=0,100,…,900`) is a separate queued job, never blocking a request; persist aggregates as you go so the UI can show "analizando 320/1.000…".

## 4. Rate-limit engineering

- **Three tiers:** *application* (key per region), *method* (endpoint per key per region), *service* (shared across all apps). Buckets "start when you make your first API call"; limits are **per region** (`na1` vs `euw1` independent).
- **Self-tune from headers, don't guess:** `X-App-Rate-Limit`, `X-App-Rate-Limit-Count`, `X-Method-Rate-Limit`, `X-Method-Rate-Limit-Count`; on 429 also `Retry-After` (seconds) and `X-Rate-Limit-Type` (`application|method|service`). If both are **absent**, the 429 came from the underlying service, not the API edge → use your own exponential backoff with full jitter ([hextechdocs mirror of the official text](https://hextechdocs.dev/rate-limiting/), [docs/portal](https://developer.riotgames.com/docs/portal)).
- **Token bucket** per `(region, method)`; on 429 sleep `Retry-After + rand()` and drain that bucket. Route *all* Riot traffic through one process so the bucket is in-memory.
- **Single-flight:** `INSERT … ON CONFLICT DO NOTHING` on `matches`/`puuid_matches`; one `UNIQUE` job row per puuid so concurrent visitors enqueue one job.
- **Never fan out N requests per page view.** Enforce structurally: the Riot key lives only on the worker; the web tier holds DB creds only. If you must read-through on first visit, hard-cap at ~25 calls and render a "processing" state.
- **Key rotation / key pool = ToS violation. Verified:**
  - FAQ: "you may NOT have multiple applications to bypass rate limits." ([docs/faqs](https://developer.riotgames.com/docs/faqs))
  - Terms: "You may create only one (1) developer account… You may not sell, transfer, sublicense or otherwise disclose Your API Key(s) to any other party." ([terms#key](https://developer.riotgames.com/terms#key))
  - Terms §Limitations: **"A Development Key shall not be permitted to make more than ten (10) network calls every ten (10) seconds."** — *stricter* than the portal's 20/1s+100/2min; design to 1 rps.
  - Correct alternative: **apply for a production key** (free), reviews weekly, "sometimes… up to three weeks".

## 5. Free-tier stack for 1 dev

| Option | Verified free tier | Use |
|---|---|---|
| Next.js `fetch(..., {next:{revalidate}})` (Vercel Data Cache) | persists request→request **and across deploys** ("For data that needs to persist across deploys, use `unstable_cache`… or the `fetch` cache") | match payloads by URL |
| Next.js `use cache` + `cacheLife` | ⚠️ cache key **includes the deployment ID** → wiped on every deploy; on serverless "entries typically don't persist across requests" | render-level only, **not** storage |
| Upstash Redis | 250 MB, 500K cmds/mo, 10 GB egress | dedupe lock, counters |
| Turso (libSQL) | 100 dbs, 5 GB, 500M rows read/mo, 10M written/mo | best free read budget |
| Neon Postgres | 100 projects, 1 GB/project, 100 CU-hrs/mo | best "real Postgres" |
| Supabase | 500 MB, 5 GB egress, 2 projects, **paused after 1 week inactivity** | avoid for low traffic |
| Vercel Cron (Hobby) | 100 jobs, **min interval daily**, ±59 min | too coarse |
| GitHub Actions `schedule` | **5-min** minimum interval; auto-disabled after **60 days** repo inactivity (public) | ✅ the worker |

*(Also checked: CF Workers KV = 100k reads/day but only **1,000 writes/day** — too low for backfill; CF D1 = 500 MB/db, 5 GB/account.)*

**Recommendation:** Next.js on Vercel (read-only DB) → **Neon Postgres** (match store + aggregates + job queue) → **GitHub Actions cron every 10 min** running the ingest worker (token bucket in-process) → optionally Upstash Redis for locks. **$0/month**, one deploy target, one cron file, no always-on server. Extensible: every future feature (rune stats, per-queue splits, duos) is a new aggregate table over the same immutable match store.

## 6. Third-party fallbacks — none usable

- **OP.GG** (primary source): "All game data currently used by OP.GG is collected through official APIs provided by each game company, **and this data is not provided to third parties.**" On scraping: "In general, OP.GG does not prohibit data crawling or web scraping. However, if there is any commercial use without citing the source or if excessive requests affect our service operation, access to the service may be restricted." ([help.op.gg](https://help.op.gg/hc/en-us/articles/31091405109401-Can-I-use-OP-GG-data))
- **U.GG / Mobalytics / LeagueOfGraphs / lolalytics / DeepLoL:** no public per-account match-history API in any docs; **UNVERIFIED** whether a partner feed exists. `deeplol.gg/robots.txt` is `User-agent: * / Allow: /` — permission to crawl, not a licence to the data.
- **Fatal point regardless of legality:** all sit downstream of the *same* Riot API and inherit the **same 1,000-match cap**; they hold only what they themselves tracked. Scraping yields a *shorter*, not longer, window.
- **Policy risk:** Terms forbid collecting "any additional information about the Game or Game users that is not provided Game Information"; public products must be registered/audited in the Developer Portal. LoL-specific: "Products may not publicly display a player's match history from the custom match queue unless the player opts in" ([docs/lol#game-policy](https://developer.riotgames.com/docs/lol#game-policy)) — filter customs out.

## Gaps / unverified
- **UNVERIFIED:** per-method rate limits for MATCH-V5 on production keys (Riot doesn't publish them; read `X-Method-Rate-Limit` off a live 200).
- **UNVERIFIED:** whether any `lol-challenges-v1` challenge value equals lifetime games.
- **UNVERIFIED:** partner APIs at U.GG/Mobalytics/LeagueOfGraphs/DeepLoL.
- Contradiction to flag: portal says personal keys = 20/1s + 100/2min; the API Terms cap development keys at 10 calls/10 s. Design to the stricter one.
