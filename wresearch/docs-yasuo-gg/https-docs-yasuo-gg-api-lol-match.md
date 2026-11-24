[ Skip to content ](https://docs.yasuo.gg/api/lol-match/#match-yasuololmatch)
[ ](https://docs.yasuo.gg/ "Yasuo")
Yasuo 
Match 
Initializing search 
[ justadev-afk/yasuo.js  ](https://github.com/justadev-afk/yasuo.js "Go to repository")
[ ](https://docs.yasuo.gg/ "Yasuo") Yasuo 
[ justadev-afk/yasuo.js  ](https://github.com/justadev-afk/yasuo.js "Go to repository")
  * [ Home  ](https://docs.yasuo.gg/)
  * [ Getting started  ](https://docs.yasuo.gg/getting-started/)
  * Guides  Guides 
    * [ Entities & lazy relations  ](https://docs.yasuo.gg/entities-and-relations/)
    * [ Rate limiting  ](https://docs.yasuo.gg/rate-limiting/)
    * [ Transport & middleware  ](https://docs.yasuo.gg/http-and-middleware/)
    * [ Caching  ](https://docs.yasuo.gg/caching/)
    * [ Logging  ](https://docs.yasuo.gg/logging/)
    * [ Pagination  ](https://docs.yasuo.gg/pagination/)
    * [ Errors  ](https://docs.yasuo.gg/errors/)
  * API reference  API reference 
    * [ Overview  ](https://docs.yasuo.gg/api/)
    * League of Legends  League of Legends 
      * [ Summoner  ](https://docs.yasuo.gg/api/lol-summoner/)
      * [ League  ](https://docs.yasuo.gg/api/lol-league/)
      * [ Champion Mastery  ](https://docs.yasuo.gg/api/lol-champion-mastery/)
      * [ Champion Rotation  ](https://docs.yasuo.gg/api/lol-champion/)
      * Match  [ Match  ](https://docs.yasuo.gg/api/lol-match/) Table of contents 
        * [ Methods  ](https://docs.yasuo.gg/api/lol-match/#methods)
          * [ get(matchId, regionGroup)  ](https://docs.yasuo.gg/api/lol-match/#getmatchid-regiongroup)
          * [ timeline(matchId, regionGroup)  ](https://docs.yasuo.gg/api/lol-match/#timelinematchid-regiongroup)
          * [ idsByPuuid(puuid, regionGroup, query?)  ](https://docs.yasuo.gg/api/lol-match/#idsbypuuidpuuid-regiongroup-query)
          * [ byPuuid(puuid, regionGroup, query?)  ](https://docs.yasuo.gg/api/lol-match/#bypuuidpuuid-regiongroup-query)
          * [ streamIds(puuid, regionGroup, options?)  ](https://docs.yasuo.gg/api/lol-match/#streamidspuuid-regiongroup-options)
          * [ streamMatches(puuid, regionGroup, options?)  ](https://docs.yasuo.gg/api/lol-match/#streammatchespuuid-regiongroup-options)
        * [ MatchEntity relations & helpers  ](https://docs.yasuo.gg/api/lol-match/#matchentity-relations-helpers)
      * [ Spectator  ](https://docs.yasuo.gg/api/lol-spectator/)
      * [ Status  ](https://docs.yasuo.gg/api/lol-status/)
      * [ Clash  ](https://docs.yasuo.gg/api/lol-clash/)
      * [ Challenges  ](https://docs.yasuo.gg/api/lol-challenges/)
      * [ Tournament  ](https://docs.yasuo.gg/api/lol-tournament/)
    * Teamfight Tactics  Teamfight Tactics 
      * [ Summoner  ](https://docs.yasuo.gg/api/tft-summoner/)
      * [ League  ](https://docs.yasuo.gg/api/tft-league/)
      * [ Match  ](https://docs.yasuo.gg/api/tft-match/)
      * [ Spectator  ](https://docs.yasuo.gg/api/tft-spectator/)
    * VALORANT  VALORANT 
      * [ Content  ](https://docs.yasuo.gg/api/val-content/)
      * [ Match  ](https://docs.yasuo.gg/api/val-match/)
      * [ Console Match  ](https://docs.yasuo.gg/api/val-console-match/)
      * [ Ranked  ](https://docs.yasuo.gg/api/val-ranked/)
      * [ Status  ](https://docs.yasuo.gg/api/val-status/)
    * Legends of Runeterra  Legends of Runeterra 
      * [ Match  ](https://docs.yasuo.gg/api/lor-match/)
      * [ Ranked  ](https://docs.yasuo.gg/api/lor-ranked/)
      * [ Status  ](https://docs.yasuo.gg/api/lor-status/)
    * Riot & static  Riot & static 
      * [ Account  ](https://docs.yasuo.gg/api/riot-account/)
      * [ Data Dragon  ](https://docs.yasuo.gg/api/data-dragon/)
    * [ Endpoint coverage  ](https://docs.yasuo.gg/endpoints/)
  * [ Architecture  ](https://docs.yasuo.gg/architecture/)
  * [ Migrating from twisted  ](https://docs.yasuo.gg/migrating-from-twisted/)


Table of contents 
  * [ Methods  ](https://docs.yasuo.gg/api/lol-match/#methods)
    * [ get(matchId, regionGroup)  ](https://docs.yasuo.gg/api/lol-match/#getmatchid-regiongroup)
    * [ timeline(matchId, regionGroup)  ](https://docs.yasuo.gg/api/lol-match/#timelinematchid-regiongroup)
    * [ idsByPuuid(puuid, regionGroup, query?)  ](https://docs.yasuo.gg/api/lol-match/#idsbypuuidpuuid-regiongroup-query)
    * [ byPuuid(puuid, regionGroup, query?)  ](https://docs.yasuo.gg/api/lol-match/#bypuuidpuuid-regiongroup-query)
    * [ streamIds(puuid, regionGroup, options?)  ](https://docs.yasuo.gg/api/lol-match/#streamidspuuid-regiongroup-options)
    * [ streamMatches(puuid, regionGroup, options?)  ](https://docs.yasuo.gg/api/lol-match/#streammatchespuuid-regiongroup-options)
  * [ MatchEntity relations & helpers  ](https://docs.yasuo.gg/api/lol-match/#matchentity-relations-helpers)


[ ](https://github.com/justadev-afk/yasuo.js/edit/main/docs/api/lol-match.md "Edit this page")
# Match — `yasuo.lol.match`[¶](https://docs.yasuo.gg/api/lol-match/#match-yasuololmatch "Permanent link")
The MATCH-V5 endpoints: full matches, timelines, and a player's match-id history. Every method here uses **regional** routing — pass a `RegionGroup` (`RegionGroup.ASIA`, `RegionGroup.AMERICAS`, `RegionGroup.EUROPE`), not a platform `Region`.
Every method returns a query — run it with `.execute()`. The result is the entity itself (or a `Collection`), carrying `.error` and `.http`; see [Entities & relations](https://docs.yasuo.gg/entities-and-relations/) and [Errors](https://docs.yasuo.gg/errors/). The two `stream*` methods instead return a lazy `Paginator` — see [Pagination](https://docs.yasuo.gg/pagination/).
> The examples assume `const yasuo = new Yasuo({ key })` and a `puuid` string already exist.
## Methods[¶](https://docs.yasuo.gg/api/lol-match/#methods "Permanent link")
###  `get(matchId, regionGroup)`[¶](https://docs.yasuo.gg/api/lol-match/#getmatchid-regiongroup "Permanent link")
A full match by id.
  * **Params** — `matchId: string` — the match id, e.g. `KR_1234567890`; `regionGroup: RegionGroup` — the regional routing value.
  * **Returns** — `SingleQuery<MatchEntity>` → a `MatchEntity` exposing `metadata` (`matchId`, `dataVersion`, `participants`) and `info` (`gameMode`, `gameDuration`, `queueId`, `platformId`, `participants`, `teams`, …), plus the helper methods below.
  * **Routing** — `RegionGroup`.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-1)import { RegionGroup } from 'yasuo.js'
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-2)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-3)const match = await yasuo.lol.match.get('KR_1234567890', RegionGroup.ASIA).execute()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-4)if (match.error) return
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-5)console.log(match.metadata.matchId, match.info.gameMode, match.http.status)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-6)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-7)const winner = match.winningTeam()      // MatchTeamDTO | null
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-8)const me = match.participant(puuid)     // MatchParticipantDTO | undefined
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-0-9)const region = match.platformRegion()   // Region | null

```

###  `timeline(matchId, regionGroup)`[¶](https://docs.yasuo.gg/api/lol-match/#timelinematchid-regiongroup "Permanent link")
A match timeline (per-frame snapshots and events) by id.
  * **Params** — `matchId: string` — the match id; `regionGroup: RegionGroup` — the regional routing value.
  * **Returns** — `SingleQuery<MatchTimelineEntity>` → a `MatchTimelineEntity` exposing `metadata` (`matchId`, …) and `info` (`frameInterval`, `frames`, optional `participants`), plus an `id` getter and a lazy `match()` relation.
  * **Routing** — `RegionGroup`.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-1-1)const timeline = await yasuo.lol.match.timeline('KR_1234567890', RegionGroup.ASIA).execute()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-1-2)if (timeline.error) return
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-1-3)console.log(timeline.info.frameInterval, timeline.info.frames.length)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-1-4)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-1-5)// Jump to the full match without re-passing ids:
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-1-6)const match = await timeline.match().execute()

```

###  `idsByPuuid(puuid, regionGroup, query?)`[¶](https://docs.yasuo.gg/api/lol-match/#idsbypuuidpuuid-regiongroup-query "Permanent link")
A single page of match ids for a player.
  * **Params** — `puuid: string` — the player's PUUID; `regionGroup: RegionGroup` — the regional routing value; `query?: MatchIdsQuery` — optional filters: `count` (0–100, default 20), `start` (offset, default 0), `queue` (queue id), `type` (a `MatchType`, mutually exclusive with `queue`), `startTime`/`endTime` (epoch seconds).
  * **Returns** — `CollectionQuery<string>` → a `Collection<string>` — iterate, index and `.length` it directly.
  * **Routing** — `RegionGroup`.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-1)import { MatchType } from 'yasuo.js'
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-2)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-3)const ids = await yasuo.lol.match
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-4)  .idsByPuuid(puuid, RegionGroup.ASIA, { count: 20, type: MatchType.RANKED })
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-5)  .execute()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-6)if (ids.error) return
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-7)for (const id of ids) console.log(id) // 'KR_1234…'
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-2-8)console.log(ids.length, ids.http.status)

```

###  `byPuuid(puuid, regionGroup, query?)`[¶](https://docs.yasuo.gg/api/lol-match/#bypuuidpuuid-regiongroup-query "Permanent link")
A player's recent matches, **fetched in full** — it first resolves the match ids (as `idsByPuuid`), then issues one `get` request per id and gathers them into a `Collection`. It honours the same `.execute()` options as any query: with `{ throw: true }` the first failed request throws; with `{ raw: true }` you get the array of raw Riot payloads.
  * **Params** — `puuid: string` — the player's PUUID; `regionGroup: RegionGroup` — the regional routing value; `query?: MatchIdsQuery` — the same filters as `idsByPuuid` (keep `count` small: every id becomes its own request).
  * **Returns** — `CollectionQuery<MatchEntity>` → a `Collection<MatchEntity>`.
  * **Routing** — `RegionGroup`.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-1)const matches = await yasuo.lol.match
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-2)  .byPuuid(puuid, RegionGroup.ASIA, { count: 5 })
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-3)  .execute()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-4)if (matches.error) return
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-5)for (const match of matches) {
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-6)  console.log(match.metadata.matchId, match.winningTeam()?.teamId)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-3-7)}

```

Prefer to fail loudly? Opt into throwing — any failed id or match request rejects with its `ApiError`:

```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-4-1)try {
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-4-2)  const matches = await yasuo.lol.match.byPuuid(puuid, RegionGroup.ASIA).execute({ throw: true })
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-4-3)  console.log(matches.length)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-4-4)} catch (error) {
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-4-5)  // ApiError from whichever underlying request failed
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-4-6)}

```

###  `streamIds(puuid, regionGroup, options?)`[¶](https://docs.yasuo.gg/api/lol-match/#streamidspuuid-regiongroup-options "Permanent link")
Stream a player's **entire** match-id history as a lazy async iterator, paging transparently and pacing each fetch through the rate limiter.
  * **Params** — `puuid: string` — the player's PUUID; `regionGroup: RegionGroup` — the regional routing value; `options?: MatchStreamOptions` — `start` (offset, default 0), `pageSize` (ids per request, 1–100, default 100), `maxItems` (hard cap on total), plus the `startTime`/`endTime`/`queue`/`type` filters forwarded to each page.
  * **Returns** — `Paginator<string>` — `for await` over it, or collect eagerly with `.toArray(limit?)`. See [Pagination](https://docs.yasuo.gg/pagination/).
  * **Routing** — `RegionGroup`.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-1)// Iterate lazily — pages fetched on demand:
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-2)for await (const id of yasuo.lol.match.streamIds(puuid, RegionGroup.ASIA)) {
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-3)  console.log(id)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-4)}
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-5)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-6)// Or collect the first 50 into an array:
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-5-7)const firstFifty = await yasuo.lol.match.streamIds(puuid, RegionGroup.ASIA).toArray(50)

```

###  `streamMatches(puuid, regionGroup, options?)`[¶](https://docs.yasuo.gg/api/lol-match/#streammatchespuuid-regiongroup-options "Permanent link")
Like `streamIds`, but yields **full match entities** — each page fetches its ids, then fetches every match on that page in full before yielding them.
  * **Params** — identical to `streamIds`: `puuid: string`, `regionGroup: RegionGroup`, `options?: MatchStreamOptions`.
  * **Returns** — `Paginator<MatchEntity>`. Each per-match fetch runs with `{ throw: true }` internally, so a failed match fetch rejects the iterator.
  * **Routing** — `RegionGroup`.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-6-1)for await (const match of yasuo.lol.match.streamMatches(puuid, RegionGroup.ASIA, {
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-6-2)  maxItems: 30,
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-6-3)})) {
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-6-4)  console.log(match.metadata.matchId, match.info.gameMode)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-6-5)}

```

##  `MatchEntity` relations & helpers[¶](https://docs.yasuo.gg/api/lol-match/#matchentity-relations-helpers "Permanent link")
Beyond the DTO fields (`metadata`, `info`), a `MatchEntity` adds:
  * **`id`**— the match id (`metadata.matchId`).
  * **`timeline()`**—`SingleQuery<MatchTimelineEntity>` ; the timeline for this match, with no ids re-passed.
  * **`winningTeam()`**—`MatchTeamDTO | null` ; the team whose `win` is `true`.
  * **`participant(puuid)`**—`MatchParticipantDTO | undefined` ; look up one participant by PUUID.
  * **`platformRegion()`**—`Region | null` ; the platform region derived from `info.platformId`.
  * **`summoners()`**—`SummonerRef[]` ; a lazy summoner reference per participant (throws if `info.platformId` is unrecognised). Call `.execute()` only on the ones you need.



```
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-1)const match = await yasuo.lol.match.get('KR_1234567890', RegionGroup.ASIA).execute()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-2)if (match.error) return
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-3)
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-4)// Relations run only the request you ask for:
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-5)const timeline = await match.timeline().execute()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-6)const [firstPlayer] = match.summoners()
[](https://docs.yasuo.gg/api/lol-match/#__codelineno-7-7)const summoner = await firstPlayer.execute()

```

`MatchTimelineEntity` mirrors this with an `id` getter and a `match()` relation back to the full match.
Back to top  [ Previous  Champion Rotation  ](https://docs.yasuo.gg/api/lol-champion/) [ Next  Spectator  ](https://docs.yasuo.gg/api/lol-spectator/)
Copyright © justadev-afk — MIT licensed 
Made with [ Material for MkDocs ](https://squidfunk.github.io/mkdocs-material/)
[ ](https://github.com/justadev-afk/yasuo.js "github.com") [ ](https://www.npmjs.com/package/yasuo "www.npmjs.com")
