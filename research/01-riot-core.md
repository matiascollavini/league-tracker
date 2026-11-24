# Research: Official Riot Games API for a LoL stats site

## Summary
v1 needs three official surfaces: **ACCOUNT-V1** (Riot ID → PUUID), **MATCH-V5** (match IDs + match detail), **Data Dragon** (championId → name/image/locale). A *public* site legally needs a **Production key** ("You may not maintain a public product with a development API key"), which requires a live verified domain + ToS/Privacy Policy; review is weekly, up to 3 weeks. Production baseline is 500 req/10 s + 30,000 req/10 min **per region** — plenty for a small site if you cache.

Verified against live official docs (retrieved 2026-05): `developer.riotgames.com/docs/{lol,portal,faqs}`, `developer.riotgames.com/policies/general`, `/terms`, and API reference pages `developer.riotgames.com/api-details/<service>` (server-rendered HTML, so citable).

---

## 1. Portal & key lifecycle
Sources: [docs/portal](https://developer.riotgames.com/docs/portal), [docs/lol](https://developer.riotgames.com/docs/lol), [docs/faqs](https://developer.riotgames.com/docs/faqs)

| Key | How | Limits | Constraints |
|---|---|---|---|
| **Development** | auto-issued on first sign-in at `developer.riotgames.com` | not published (§2) | **"deactivate every 24 hours"** — reset daily; not for public use |
| **Personal** | register product at `developer.riotgames.com/app-type` + detailed description | 20 req/1 s + 100 req/2 min, per region | no verification → no limit increases; Standard APIs only (no Tournaments) |
| **Production** | same flow, "larger scale" + site verification | 500 req/10 s + 30,000 req/10 min, per region | requires working prototype/site; required for public consumption |

Production requirements (official):
- **Live website**: "Production keys are for applications that are in a completed or near-complete state." Need a domain Riot can inspect.
- **Verification**: Riot issues a text string you upload to your URL — "We cannot grant production keys to applications without a verified website" ([how-to-verify-site.html](https://developer.riotgames.com/how-to-verify-site.html)).
- Riot must be able to "view your Terms of Service and Privacy Policy" ⇒ both pages de-facto mandatory.
- User-flow evidence: screenshots, video demos, mockups, a deck, or "new app that is fully functional and testable by Riot".
- **Timing**: "Applications are typically reviewed weekly for the previous week… sometimes the review process can take up to three weeks."
- Approved use case matching this product: **"Showing (self) player stats"**, "Training tools that allow players to view their own match histories and aggregate stats", "Aggregate player stats (no specific players)".
- **A hobby site can get one** — but only once the domain exists + is verified + has a privacy policy. Personal keys cover "personal sites / school projects" and explicitly **not** public consumption ("public consumption includes open alpha/beta tests"). One product per key; extra apps can't bypass limits.

---

## 2. Rate limits (as published today)
Source: [docs/portal → Rate Limiting](https://developer.riotgames.com/docs/portal); header semantics from the archived official doc at [hextechdocs.dev/rate-limiting](https://hextechdocs.dev/rate-limiting/)

- Personal: `20 requests every 1 second` + `100 requests every 2 minutes`.
- Production starting tier: `500 requests every 10 seconds` + `30,000 requests every 10 minutes`.
- "Rate limits are enforced **per region**" (20/s to NA1 *and* 20/s to EUW1 simultaneously).
- **The dev-key number is not published on that page.** The 2013 API Terms still assert "A Development Key shall not be permitted to make more than ten (10) network calls every ten (10) seconds" ([terms](https://developer.riotgames.com/terms)) — stale. Real headers for a non-production key: `x-app-rate-limit: 20:1,100:120` ([developer-relations#697](https://github.com/RiotGames/developer-relations/issues/697)). **Treat dev ≈ 20/s + 100/2 min as UNVERIFIED-by-docs; log `X-App-Rate-Limit` on the first call to confirm.**

Three layers, all per region: **application** (per key, all methods; static-data excluded), **method** (per endpoint + key), **service** (shared by all apps). Effective throughput = `min(app, method)`. Issue #697 shows a key with `x-app-rate-limit: 20:1,100:120` and `x-method-rate-limit: 250:10` 429-ing at ~80 req because the app bucket bound first.

```
X-App-Rate-Limit: 20:1,100:120          # allowed:seconds, comma-separated
X-App-Rate-Limit-Count: 18:1,95:120
X-Method-Rate-Limit / X-Method-Rate-Limit-Count
Retry-After: 5                                    # 429 only, seconds
X-Rate-Limit-Type: application|method|service     # 429 only
```
- On 429: halt and sleep `Retry-After` ("Applications in violation of this policy may have their access disabled").
- **No `X-Rate-Limit-Type` on a 429** ⇒ the *underlying service* limited you, not the API edge; back off harder.
- "the bucket starts when you make your first API call" (not wall-clock aligned).

---

## 3. Endpoints for v1
Hosts — **platform**: `la1 la2 na1 br1 euw1 eun1 kr jp1 oc1 tr1 ru ph2 sg2 th2 vn2 me1 .api.riotgames.com`; **regional**: `americas asia europe sea .api.riotgames.com`. (`me1` exists in the API-reference selector but is missing from the docs table — table is stale.)
Cluster map (match-v5 reference page): AMERICAS = NA, BR, LAN, LAS · ASIA = KR, JP · EUROPE = EUNE, EUW, ME1, TR, RU · SEA = OCE, SG2, TW2, VN2.
Auth: header `X-Riot-Token: <KEY>` (the `?api_key=` form works but leaks the key).

- **ACCOUNT-V1** — regional only (`americas|asia|europe`, plus an `ESPORTS` variant):
  `GET https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
  Also `/accounts/by-puuid/{puuid}`, `/active-shards/by-game/lol/by-puuid/{puuid}`. "You can query for any account in any region"; accounts data from each cluster is identical.
  Migration: since **2023-11-20** Riot ID is authoritative; `summoner-v4/by-name/{summonerName}` is **deprecated** ("In future releases, we will remove summoner names from the API altogether").
- **SUMMONER-V4** — platform: `/lol/summoner/v4/summoners/by-puuid/{puuid}` → `profileIconId`, `summonerLevel`, `revisionDate`, `puuid`.
  **Gotcha:** current DTO has **no** `id`/`accountId`/`name` (the migration doc's "including summonerID" is outdated). Optional for v1: match-v5 participants already carry `profileIcon` + `summonerLevel`.
- **MATCH-V5** — **regional, not platform**:
  `GET /lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=100&type=ranked&queue=420&startTime=&endTime=`
  `start` (default 0), `count` (default 20, **valid 0–100**), `queue` (int), `type` (`ranked|normal|tourney|tutorial`), `startTime`/`endTime` (epoch s; "The matchlist started storing timestamps on June 16th, 2021… matches played before… won't be included if the startTime filter is set"). Returns `List[string]`.
  `GET /lol/match/v5/matches/{matchId}`; also `/timeline`, `/replays`.
- **CHAMPION-MASTERY-V4** — platform: `/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}` (points desc), `/by-puuid/{puuid}/top?count=N`, `/by-puuid/{puuid}/by-champion/{championId}`, `/scores/by-puuid/{puuid}`. Ranks by **points**, not games — not an exact "most played".
- **LEAGUE-V4** — platform: `/lol/league/v4/entries/by-puuid/{puuid}` → `Set<LeagueEntryDTO>`: `queueType` (`RANKED_SOLO_5x5`, `RANKED_FLEX_SR`), `tier`, `rank`, `leaguePoints`, `wins`, `losses`, `hotStreak`, `inactive`, `miniSeries`.
- **Data Dragon** (no key, no rate limit):
  - `https://ddragon.leagueoflegends.com/api/versions.json` — newest first; `16.23.1` at time of writing.
  - Region client version: `…/realms/na.json` → `{"v":"16.23.1","l":"en_US","cdn":"…"}`.
  - Locales: `…/cdn/languages.json` — includes **`es_ES`** (also `es_MX`, `es_AR`).
  - `…/cdn/{VER}/data/{LOCALE}/champion.json` → `{"type":"champion","version":"16.23.1","data":{…}}`; **173 champions** in `es_ES`; per entry: `id:"Aatrox"` (string, used in asset filenames), `key:"266"` (stringified numeric `championId`), `name` (localized), `title`, `blurb`, `info{attack,defense,magic,difficulty}`, `image.full`, `tags`, `partype`, `stats`.
  - Map `championId`→champion by indexing `key`. Shortcut: match-v5 `championName` equals the DDragon `id`; `championId` was invalid for matches before patch 11.4 (2021-02-18) — Riot: "we recommend determining the champion based on the championName field".
  - Icons: `…/cdn/{VER}/img/champion/{id}.png`; splash (version-less): `…/cdn/img/champion/splash/{id}_{skin}.jpg`.
  - CommunityDragon (**unofficial**, absent from Riot docs → UNVERIFIED support): `raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`.

---

## 4. Schemas (abridged)
```jsonc
// account-v1 by-riot-id (200) — fields "may be excluded… if the account doesn't have" them
{ "puuid": "…78 chars…", "gameName": "Hide on bush", "tagLine": "KR1" }
// summoner-v4 by-puuid (200)
{ "puuid": "…", "profileIconId": 4321, "revisionDate": 1747000000000, "summonerLevel": 512 }
// match-v5 ids (200)
["KR_7412345678","KR_7412345677"]
// match-v5 detail (200)
{ "metadata": { "dataVersion": "2", "matchId": "KR_7412345678", "participants": ["puuid", "…"] },
  "info": { "gameCreation": 1747000000000, "gameStartTimestamp": 1747000000000,
            "gameEndTimestamp": 1747000183200, "gameDuration": 1832,
            "gameMode": "CLASSIC", "gameType": "MATCHED_GAME", "gameVersion": "15.9.541.1234",
            "mapId": 11, "platformId": "KR", "queueId": 420, "endOfGameResult": "GameComplete",
            "participants": [ { "puuid": "…", "championId": 266, "championName": "Aatrox",
              "riotIdGameName": "Hide on bush", "riotIdTagline": "KR1", "teamId": 100,
              "teamPosition": "TOP", "individualPosition": "TOP", "lane": "TOP", "role": "SOLO",
              "win": true, "kills": 7, "deaths": 2, "assists": 9, "champLevel": 16,
              "profileIcon": 4321, "summonerLevel": 512, "totalMinionsKilled": 210,
              "goldEarned": 13400, "visionScore": 31, "item0": 3078, "item6": 3340,
              "teamEarlySurrendered": false, "timePlayed": 1832 } ],
            "teams": [ { "teamId": 100, "win": true, "objectives": {}, "bans": [] } ] } }
```
- Per-champion stats: filter `info.participants` by `puuid`, group by `championId`/`championName`, aggregate `win`, `kills/deaths/assists`.
- `gameDuration` semantics changed in **patch 11.20 (2021-10-05)**: seconds when `gameEndTimestamp` is present, milliseconds before ⇒ always branch on it.
- Riot returns "only non-empty values… Any numeric field that isn't returned can be assumed to be 0." Use `teamPosition` over `individualPosition` (official recommendation).
- Queue IDs ([queues.json](https://static.developer.riotgames.com/docs/lol/queues.json)): `420` Ranked Solo, `440` Ranked Flex, `400` Draft, `430` Blind, `450` ARAM, `0` Custom, `1700` Arena, `1900` Pick URF.

---

## 5. Errors & gotchas
[docs/portal → Response Codes](https://developer.riotgames.com/docs/portal); each service page also lists 405/502/504.

- **400** syntax/param error (wrong type, bad time range, missing param) · **401** no key · **403** invalid/blacklisted key *or wrong/unsupported path* (also: expired dev key) · **404** resource not found / no matching results · **415** bad `Content-Type` · **429** rate limited → `Retry-After` · **500** internal · **503** temporarily unavailable.
- **Dev key dies every 24 h** ⇒ 403 "Forbidden". Automate the reset.
- Error bodies are not guaranteed JSON; "fail gracefully based on the response code alone". Typical: `{"status":{"message":"Unauthorized","status_code":401}}`.
- Never-ranked player on `league-v4/entries/by-puuid`: expect an empty set (documented type `Set[…]. Empty-set vs 404 behavior is UNVERIFIED here — handle both.
- `count>100` ⇒ 400. Wrong host family (platform↔regional) is the most common self-inflicted 403/404.

---

## 6. Policies / legal
- [General Policies](https://developer.riotgames.com/policies/general) (LAST UPDATED MAY 29, 2025): "All products must be registered in, and audited by Riot Games through the Developer Portal… Any new features or changes must be audited." Required visible boilerplate: *"[Your product] isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games…"* Monetization only when status is "Approved or Acknowledged", must keep a free tier, must be "transformative"; no betting/gambling. Assets limited to Data Dragon, Press Kit, TFT/LoR packs.
- [docs/lol → Developer API Policy](https://developer.riotgames.com/docs/lol#developer-api-policy): "**No apps serving as a 'data broker' between our API and another third-party company**" (no exposing your own API to third parties); no apps resembling Riot's products; custom-queue match history may not be shown publicly without opt-in.
- [API Terms](https://developer.riotgames.com/terms) (2013): may not "distribute, sell, transfer, encumber, sublicense, rent, loan, lend or lease the Riot Games API… and/or access thereto to any third party"; reselling/licensing or charging for access to Game Information needs **Riot's prior written approval**; plain advertising is fine.
- **Caching**: no TTL mandated; official guidance — match history "30 minutes is a reasonable expiry time", profile icons/summoner names "such as 24 hours", static data "even longer" ([archived official text](https://hextechdocs.dev/rate-limiting/)).
- **Privacy/GDPR**: "you may have access to personal data subject to the GDPR… When Riot Games receives a request from an end user to delete their personal data, we will be passing the request to all active developers by sharing a list of identifiers (e.g. accountId)" ⇒ you must support deletion on request, and publish a privacy policy (also a production-key gate).
- **Data-retention period for match data is not published anywhere I could find — UNVERIFIED.**

---

## 7. Ecosystem facts
- **Riot ID**: `gameName#tagLine`; Game Name **3–16 alphanumeric**, not required to be unique; Tagline **3–5 alphanumeric**; region-code taglines (NA1, EUW, KR…) unusable after a change; free rename on a 90-day cooldown ([Riot ID FAQ](https://support.riotgames.com/league-of-legends/account/riot-id-faq)). URL-encode both path segments (spaces/accents; strip `#`).
- **PUUID**: "Exact length of 78 characters", encrypted; identical data from every cluster, so one lookup suffices. Whether a PUUID is shared across *different Riot games* is UNVERIFIED in the docs.
- **Region vs cluster**: player data stays sharded to the LoL platform (`platformId`), while `americas/asia/europe/sea` are cross-region clusters for account/match services. Match IDs are platform-prefixed (`KR_…`, `LA1_…`).
- **Versioning**: "Currently, all League of Legends APIs are version 4. We no longer include a minor version in the API path"; each service keeps its own major in the path (`account/v1`, `match/v5`, `summoner/v4`, `champion-mastery/v4`, `league/v4`).
- **Deprecation**: "we aim to support both old and new versions… for 60 days", announced on the DevRel blog/Discord; deprecated endpoints error out.
- **Season resets**: no reset event; detect via `gameVersion` (first two segments = patch), `queueId`, and league-v4 tier/LP changing. Mastery `chestGranted`/`championSeasonMilestone` are season-scoped.
- Optional: `lol-status-v4` for platform maintenance banners.
