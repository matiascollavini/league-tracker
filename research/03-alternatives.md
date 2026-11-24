# Free / free-tier LoL player & match data sources — comparison

## Summary
There is exactly **one** free, legal, stable source of *per-player* match data: the **Riot Games official API** (free, key-based, no paid tier; personal key = 20 req/1s + 100 req/2min per region; production key = 500 req/10s + 30k req/10min). Every third-party stats site (OP.GG, U.GG, DeepLoL, Mobalytics, LeagueOfGraphs, LoLalytics) exposes **no public API**; internal JSON is undocumented, rotates, and is either banned by ToS or blocked by Cloudflare. **Data Dragon** (official, keyless, unmetered) is the free complement for champion ids/names/icons. Recommendation: **Riot API + Data Dragon, nothing else.**

## 1. Riot official API (baseline)
- **Auth**: header `X-Riot-Token: <key>`; no OAuth (RSO only for "log in with Riot", production keys only).
- **Key tiers**, all free, no paid plan ([portal docs](https://developer.riotgames.com/docs/portal)):
  - *Development*: instant, **expires every 24h**, prototype only.
  - *Personal*: **20 req / 1 s** and **100 req / 2 min**, per region. *"You may not run your application for public consumption using a personal key… public consumption includes open alpha/beta tests."*
  - *Production*: from **500 req / 10 s + 30,000 req / 10 min** per region; needs a testable prototype; weeks of review.
- **Endpoints for v1** (account/match are *regional* hosts; others *platform*) — [routing values](https://developer.riotgames.com/docs/lol#routing-values):
  - `GET https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` → `{puuid, gameName, tagLine}` (regions: `americas`, `asia`, `europe`, `sea`).
  - `GET https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/{encryptedSummonerId}` → `{tier, rank, leaguePoints, queueType}`. A `by-puuid` variant exists but I could **not** confirm its exact path — **UNVERIFIED**.
  - `GET https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=20&queue=420&type=ranked` → match-ID array. `start` default 0, **`count` 0–100**, `queue`/`type` are *mutually inclusive* ([RiotWatcher MatchApiV5](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/MatchApiV5.html)).
  - `GET https://europe.api.riotgames.com/lol/match/v5/matches/{matchId}` → `info.participants[].{puuid, championId, championName, win, teamPosition, kills, deaths, assists}`, plus `info.queueId`, `info.gameCreation`.
- **Per-champion stats**: no aggregate endpoint — you fold participants into `Map<championId,{games,wins}>`. Cheapest profile = 1 account + 1 id-list + 20 match calls = **22 calls**.
- **Rate-limit surface**: `X-App-Rate-Limit`, `X-App-Rate-Limit-Count`, `X-Method-Rate-Limit(-Count)`, `X-Rate-Limit-Type`; **429** carries `Retry-After`. Service-level limits 429 *without* `X-Rate-Limit-Type` ([archived official page](https://hextechdocs.dev/rate-limiting/)).
- **Errors/parsing**: 400 bad param, 401 no key, **403 = invalid/blacklisted key or wrong path**, 404, 415, 429, 500/503. Non-200 bodies are not guaranteed JSON → branch on status code. **Empty values are omitted from JSON** (missing numeric ⇒ 0) ([response codes](https://developer.riotgames.com/docs/portal#web-apis_response-codes)).
- **Policy constraints that hit this project** ([General Policies, rev. 2025-05-29](https://developer.riotgames.com/policies/general), [LoL game policy](https://developer.riotgames.com/docs/lol#game-policy)): public site showing *other people's* history ⇒ production key + registered/audited product; mandatory visible boilerplate *"[Product] isn't endorsed by Riot Games…"*; assets must come from Data Dragon/Press Kit; free tier required if you monetize; *"Products may not publicly display a player's match history from the custom match queue unless the player opts in"* ⇒ **drop queue 0**; *"Products cannot display win rates for Augments or Arena Mode items"* ⇒ keep filters on SR queues; *"Products should use supported services from Riot Games for data ingestion"* — the clause that makes scraped data a policy risk even with a valid key; token must never reach the browser.
- **Verdict**: **core, and only core.** Free forever, official, exactly the fields needed.

## 2. DeepLoL (deeplol.gg)
- GameEye Corp; `robots.txt` = `User-agent: * / Allow: /`.
- **No public API, no developer docs, no pricing page.** `api.deeplol.gg` does not resolve (DNS NXDOMAIN, checked today). Their support portal only offers "PRO/STRM Registration" (streamer overlays), not data access.
- Whether a private/commercial feed exists: **UNVERIFIED**.
- **Verdict**: not a data source; scraping only. Skip.

## 3. OP.GG
- No public API. Internal JSON at `https://lol-web-api.op.gg/api/v1.0/internal/bypass/…` requires a per-user **"user encoded key … found in the request URLs when you interact with the user pages"** ([op.gg-sdk README](https://github.com/jayjayholic/op.gg-sdk)) — session-bound, undocumented, rotates.
- **Legal position contradicts itself**: [ToS](https://op.gg/lol/policies/agreement) (personal, non-commercial) bans *"scraping or data mining while using the Sites"* and *"use automated scripts to collect information"*; but the [Help Center FAQ](https://help.op.gg/hc/en-us/articles/31091405109401-Can-I-use-OP-GG-data) says *"In general, OP.GG does not prohibit data crawling or web scraping. However, if there is any commercial use without citing the source or if excessive requests affect our service operation, access to the service may be restricted."* Same FAQ: their data *"is collected through official APIs… and is not provided to third parties."*
- **Verdict**: do not depend on it — the FAQ is not a licence, the ToS is.

## 4. U.GG
- `robots.txt`: Cloudflare **Content Signals** (`search=yes, ai-train=no, use=reference`) then `User-agent: * Disallow: /*?*` → **every query-string (API-style) URL disallowed for all crawlers**.
- Cloudflare **JS challenge** blocks non-browser clients (verified: `Blocked by anti-bot protection: Cloudflare JS challenge`).
- ToS (`u.gg/terms-of-service`, last updated **2018-05-25**) is short; no explicit anti-scraping clause found in retrieved text — **UNVERIFIED**.
- **Verdict**: no API, hostile to automation. Skip.

## 5. Mobalytics / LeagueOfGraphs / LoLalytics
- **Mobalytics**: no public data API (only "Mobalytics Widgets" for streamers); internal `api.mobalytics.gg` undocumented; ToS text **UNVERIFIED**. Skip.
- **LeagueOfGraphs**: `robots.txt` explicitly `Disallow: /api/*`, plus `/summoner/*`, `/*match/*`, `/*search/*`, `/live/*`. Everything useful is banned. Skip.
- **LoLalytics**: `robots.txt` has only the Cloudflare content-signal block (`User-agent: * Allow: /`) + `AmazonAdBot Crawl-delay: 1` — no `/api/` ban. Data per-region (`a3.lolalytics.com`), heavy anti-bot; wrappers exist ([`lolalytics-api`](https://pypi.org/project/lolalytics-api/)). Least-blocked, still undocumented scrape + against Riot's "supported services" clause. Skip.

## 6. Riot LoL Esports API (official-hosted, pro play only)
- `https://esports-api.lolesports.com/persisted/gw/{method}?hl=es-ES` with `x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z` (public key, [unofficial docs](https://vickz84259.github.io/lolesports-api-docs/)); mirror `prod-relapi.ewp.gg`.
- Methods: `getLeagues`, `getTournamentsForLeague`, `getStandings`, `getSchedule`, `getLive`, `getEventDetails`, `getGames`, `getWindow`, `getDetails`. Locales incl. `es-ES`, `es-MX`.
- Pro play only; limits/SLA **UNVERIFIED**. **Verdict**: irrelevant now, good for a future esports tab.

## 7. Leaguepedia Cargo (pro play only)
- `https://lol.fandom.com/api.php?action=cargoquery&format=json&tables=ScoreboardGames=SG&fields=…&limit=50&offset=50` — [help](https://lol.fandom.com/wiki/Help:Leaguepedia_API).
- Requires **bot password + confirmed email**; Fandom rate limits make anonymous Cargo queries "practically impossible". Tables: `ScoreboardGames`, `ScoreboardPlayers`, `ScoreboardTeams`, `Tournaments`, `MatchSchedule`, `Players`/`PlayerRedirects`. No `*` wildcards; row IDs not stable.
- **Verdict**: no — pro play + authenticated bots.

## 8. Static data: Data Dragon / CommunityDragon / Meraki CDN
- **Data Dragon — official, keyless, not counted against app rate limits** ([docs](https://developer.riotgames.com/docs/lol#data-dragon)):
  - `https://ddragon.leagueoflegends.com/api/versions.json` (current at crawl: **16.23.1**)
  - `https://ddragon.leagueoflegends.com/cdn/16.23.1/data/en_US/champion.json` (+ per-champion `champion/Aatrox.json`)
  - `https://ddragon.leagueoflegends.com/cdn/16.23.1/img/champion/Aatrox.png`
  - `https://ddragon.leagueoflegends.com/realms/euw.json` (live region version), `…/cdn/languages.json` (locale dirs, e.g. `en_US`, `es_ES`).
  - Maps numeric `key` (= `championId` in matches) to `id`/`name` → **the join for per-champion stats and Spanish champion names**.
- **CommunityDragon** ([docs](https://www.communitydragon.org/docs)): `raw.communitydragon.org` (client + LCU + PBE scrape), `cdn.communitydragon.org` (structured). Docs state the **CDN service "will be deprecated in the future"**. Volunteer-run.
- **Meraki CDN** (unofficial, keyless): `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/` → `champions.json` (13 MB), `items.json`, and **`championrates.json`** = play rate per `championId` × role, e.g. `{"data":{"1":{"MIDDLE":{"playRate":0.595}}}}` (mtime Feb 2026). Global meta only, **not** per-player.
- **Verdict**: Data Dragon = mandatory complement; Meraki `championrates.json` is the only free aggregate-stat nicety found (attribution + fallback required).

## 9. Libraries & proxies
- **RiotWatcher 3.2.5**, **cassiopeia 5.2.0** (Meraki, MIT, Python ≥3.12, async + datapipelines), **Pyot** — clients, not data sources: same key, same limits.
- **RapidAPI "LoL" listings** (`stefan.skliarov/LeagueOfLegends`, esports proxies): thin Riot wrappers/resellers — per-request pricing, extra hop, no SLA, and resale conflicts with Riot's registration policy; pricing **UNVERIFIED**. No.
- **henrikdev** (Valorant) is the precedent for a free community API — **nothing equivalent exists for LoL match data**.

## 10. Scraping: legality & failure modes
- Riot does not forbid reading other sites, but requires *"supported services from Riot Games for data ingestion"* and can disable key access at will.
- Observed blockers: Cloudflare JS challenge → **403** (u.gg); session-bound **encoded key** per request (op.gg); explicit `Disallow: /api/*` (LeagueOfGraphs); `Disallow: /*?*` (u.gg); contradictory FAQ vs ToS (op.gg).
- Failure modes to expect if you depend on any of them: silent endpoint renames, schema drift, IP throttling/bans, no support channel, no SLA — budget one silent breakage per quarter.

## Comparison table

| Name | Official? | Free tier | Key? | Matches | Per-champ stats | Risk | Verdict |
|---|---|---|---|---|---|---|---|
| **Riot API** | ✅ yes | unmetered, rate-limited: 100/2min personal · 30k/10min prod | ✅ `X-Riot-Token` | ✅ match-v5 ids + detail | compute yourself (trivial) | low if registered | **CORE** |
| Data Dragon | ✅ yes | unmetered static | ❌ | ❌ | id/name/icon map | none | **USE** |
| CommunityDragon | ⚠️ unofficial client mirror | unmetered | ❌ | ❌ | ❌ | CDN deprecation announced | optional |
| Meraki CDN | ⚠️ unofficial | unmetered | ❌ | ❌ | global `championrates.json` | volunteer uptime | optional |
| DeepLoL | ⚠️ site | no API | — | scrape | scrape | undocumented | skip |
| OP.GG | ⚠️ site | no API | internal encoded key | scrape | scrape | ToS bans scraping; ToS↔FAQ conflict | skip |
| U.GG | ⚠️ site | no API | — | scrape | scrape | robots `/*?*`, Cloudflare 403 | skip |
| Mobalytics | ⚠️ site | widgets only | internal | — | — | ToS unverified | skip |
| LeagueOfGraphs | ⚠️ site | no API | — | `Disallow: /api/*` | same | explicit robots ban | skip |
| LoLalytics | ⚠️ site | no API | — | scrape | scrape | fragile, anti-bot | skip |
| LoL Esports API | ✅ Riot-hosted | free, public key | ✅ (public) | pro only | ❌ | undocumented, no SLA | later |
| Leaguepedia | ⚠️ community wiki | free | ✅ bot pwd | pro only | ❌ | Fandom rate limits | later |
| RapidAPI proxies | ❌ resellers | paid tiers | ✅ | varies | varies | key/resale policy risk | no |

## Recommendation
1. **Riot API is the entire data layer**, called from your backend only: `by-riot-id` → `puuid` (cached) → `by-puuid/ids` → 20× `matches/{id}` → single pass into per-champion aggregates. Cache per-puuid results 5–15 min.
2. **Define "all matches" explicitly in code**: page ids in 100-chunks with a hard cap (e.g. `start` 0→900) — unlimited history costs unlimited requests at 100 calls/2 min, and Riot's per-player history retention is **undocumented** (UNVERIFIED).
3. **Data Dragon for statics**: pin version per patch, build `championId → {es name, icon}`; render icons from `cdn/{v}/img/champion/…`.
4. **Apply for a production key as soon as the prototype works** — a public site on a personal/dev key is a policy violation, not a rate-limit annoyance.
5. **Zero third-party dependencies.** If you later want a global-meta tab, proxy-cache Meraki `championrates.json` with attribution; everything else in the table is a liability.
