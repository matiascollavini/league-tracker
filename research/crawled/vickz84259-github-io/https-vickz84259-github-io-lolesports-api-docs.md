  * Authentication
  * Rel Api
    * leagues
      * getgetLeagues
      * getgetTournamentsForLeague
      * getgetStandings
    * events
      * getgetSchedule
      * getgetLive
      * getgetCompletedEvents
      * getgetEventDetails
      * getgetGames
    * teams
      * getgetTeams
    * match details
      * getgetWindow
      * getgetDetails
  * Highlander Api
    * highlander
      * getnavItems
      * getvideos
      * gethighlanderTournaments
      * getleagues
      * getscheduleItems
      * getteams
      * getplayers


[Documentation Powered by ReDoc](https://github.com/Rebilly/ReDoc)
# Lolesports Api (1.0.0-alpha-1)
Download OpenAPI specification:Download
Unofficial documentation to the lolesports Api
#  [](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication)Authentication
##  [](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)apiKeyAuth
The key is, `0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z`  
|  Security scheme type:   |  API Key  |  
| --- | --- |  
|  Header parameter name:  |  x-api-key  |  
#  [](https://vickz84259.github.io/lolesports-api-docs/#tag/leagues)leagues
Get information about a league, the standings and its various tournaments.
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getLeagues)getLeagues
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
###  Responses 
**200 **
Successful request
get /getLeagues
https://esports-api.lolesports.com/persisted/gw/getLeagues
https://prod-relapi.ewp.gg/persisted/gw/getLeagues
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "leagues": [
      * {
        * "name": "string",
        * "slug": "string",
        * "id": "string",
        * "image": "string",
        * "priority": 0,
        * "region": "string"
}
]
}

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getTournamentsForLeague)getTournamentsForLeague
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| leagueId  |  integer <int64> The id of the league you want details of  |  
###  Responses 
**200 **
Successful request
get /getTournamentsForLeague
https://esports-api.lolesports.com/persisted/gw/getTournamentsForLeague
https://prod-relapi.ewp.gg/persisted/gw/getTournamentsForLeague
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "leagues": [
      * {
        * "tournaments": [
          * {
            * "endDate": "string",
            * "id": "string",
            * "slug": "string",
            * "startDate": "string"
}
]
}
]
}

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getStandings)getStandings
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| tournamentId  |  Array of integers <int64> The id(s) of the tournament(s) you want details ofs  |  
###  Responses 
**200 **
Successful request
get /getStandings
https://esports-api.lolesports.com/persisted/gw/getStandings
https://prod-relapi.ewp.gg/persisted/gw/getStandings
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "standings": [
      * {
        * "stages": [
          * {
            * "name": "string",
            * "type": "groups",
            * "slug": "string",
            * "sections": [
              * {
                * "name": "string",
                * "matches": [
                  * {
                    * "teams": [
                      * {
                        * "code": "string",
                        * "image": "string",
                        * "name": "string",
                        * "id": "string",
                        * "slug": "string",
                        * "result": {
                          * "gameWins": 0,
                          * "outcome": "loss"
}
},
                      * {
                        * "code": "string",
                        * "image": "string",
                        * "name": "string"
}
],
                    * "id": "string",
                    * "state": "completed",
                    * "previousMatchIds": [
                      * "string"
],
                    * "flags": "string"
}
],
                * "rankings": [
                  * {
                    * "ordinal": 0,
                    * "teams": [
                      * {
                        * "code": "string",
                        * "image": "string",
                        * "name": "string",
                        * "id": "string",
                        * "slug": "string",
                        * "record": {
                          * "losses": 0,
                          * "wins": 0
}
}
]
}
]
}
]
}
]
}
]
}

}
#  [](https://vickz84259.github.io/lolesports-api-docs/#tag/events)events
Get information about ongoing, completed or upcoming events.
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getSchedule)getSchedule
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| leagueId  |  Array of integers <int64> The id(s) of the league(s) you want details of  |  
| pageToken  |  string <byte> Base 64 encoded string used to determine the next "page" of data to pull  |  
###  Responses 
**200 **
Successful request
get /getSchedule
https://esports-api.lolesports.com/persisted/gw/getSchedule
https://prod-relapi.ewp.gg/persisted/gw/getSchedule
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "schedule": {
      * "updated": "2019-07-13T16:33:07Z",
      * "pages": {
        * "older": "string",
        * "newer": "string"
},
      * "events": [
        * {
          * "startTime": "2019-07-13T16:33:07Z",
          * "blockName": "string",
          * "match": {
            * "teams": [
              * {
                * "code": "string",
                * "image": "string",
                * "name": "string",
                * "result": {
                  * "gameWins": 0,
                  * "outcome": "loss"
},
                * "record": {
                  * "losses": 0,
                  * "wins": 0
}
},
              * {
                * "code": "string",
                * "image": "string",
                * "name": "string"
}
],
            * "id": "string",
            * "strategy": {
              * "count": 1,
              * "type": "bestOf"
}
},
          * "state": "completed",
          * "type": "match",
          * "league": {
            * "name": "string",
            * "slug": "string"
}
}
]
}
}

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getLive)getLive
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
###  Responses 
**200 **
Successful request
get /getLive
https://esports-api.lolesports.com/persisted/gw/getLive
https://prod-relapi.ewp.gg/persisted/gw/getLive
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "schedule": {
      * "events": [
        * {
          * "startTime": "2019-07-13T16:33:07Z",
          * "blockName": "string",
          * "match": {
            * "teams": [
              * {
                * "code": "string",
                * "image": "string",
                * "name": "string",
                * "result": {
                  * "gameWins": 0,
                  * "outcome": "loss"
},
                * "slug": "string",
                * "record": {
                  * "losses": 0,
                  * "wins": 0
}
},
              * {
                * "code": "string",
                * "image": "string",
                * "name": "string"
}
],
            * "id": "string",
            * "strategy": {
              * "count": 1,
              * "type": "bestOf"
}
},
          * "state": "completed",
          * "type": "match",
          * "id": "string",
          * "league": {
            * "name": "string",
            * "slug": "string",
            * "id": "string",
            * "image": "string",
            * "priority": 0
}
}
]
}
}

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getCompletedEvents)getCompletedEvents
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| tournamentId  |  Array of integers <int64> The id(s) of the tournament(s) you want details ofs  |  
###  Responses 
**200 **
Successful request
get /getCompletedEvents
https://esports-api.lolesports.com/persisted/gw/getCompletedEvents
https://prod-relapi.ewp.gg/persisted/gw/getCompletedEvents
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "schedule": {
      * "events": [
        * {
          * "startTime": "2019-07-13T16:33:07Z",
          * "blockName": "string",
          * "match": {
            * "teams": [
              * {
                * "code": "string",
                * "image": "string",
                * "name": "string",
                * "result": {
                  * "gameWins": 0
}
},
              * {
                * "code": "string",
                * "image": "string",
                * "name": "string"
}
],
            * "id": "string",
            * "strategy": {
              * "count": 1,
              * "type": "bestOf"
},
            * "type": "normal"
},
          * "games": [
            * {
              * "vods": [
                * {
                  * "parameter": "string"
}
]
}
]
}
]
}
}

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getEventDetails)getEventDetails
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| id required   |  integer <int64> The id of the match that you want  |  
###  Responses 
**200 **
Succesful request
get /getEventDetails
https://esports-api.lolesports.com/persisted/gw/getEventDetails
https://prod-relapi.ewp.gg/persisted/gw/getEventDetails
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "event": {
      * "match": {
        * "teams": [
          * {
            * "code": "string",
            * "image": "string",
            * "name": "string",
            * "id": "string",
            * "result": {
              * "gameWins": 0
}
},
          * {
            * "code": "string",
            * "image": "string",
            * "name": "string",
            * "id": "string",
            * "result": {
              * "gameWins": 0
}
}
],
        * "games": [
          * {
            * "id": "string",
            * "state": "completed",
            * "number": 1,
            * "vods": [
              * {
                * "parameter": "string",
                * "locale": "en-US",
                * "provider": "youtube",
                * "offset": 0
}
],
            * "teams": [
              * {
                * "id": "string",
                * "side": "blue"
}
]
}
],
        * "strategy": {
          * "count": 1
}
},
      * "id": "string",
      * "type": "match",
      * "league": {
        * "name": "string",
        * "slug": "string",
        * "id": "string",
        * "image": "string"
},
      * "streams": [
        * {
          * "parameter": "string",
          * "locale": "en-US",
          * "provider": "youtube",
          * "offset": 0
}
]
}
}

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getGames)getGames
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| id  |  Array of integers <int64> The game Id(s). You can input more than one game Id(s).  |  
###  Responses 
**200 **
Successful request
get /getGames
https://esports-api.lolesports.com/persisted/gw/getGames
https://prod-relapi.ewp.gg/persisted/gw/getGames
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "games": [
      * {
        * "id": "string",
        * "state": "completed",
        * "number": 1,
        * "vods": [
          * {
            * "parameter": "string",
            * "locale": "en-US",
            * "provider": "youtube",
            * "offset": 0
}
]
}
]
}

}
#  [](https://vickz84259.github.io/lolesports-api-docs/#tag/teams)teams
Get information about a team and its roster.
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getTeams)getTeams
##### Authorizations: 
[apiKeyAuth](https://vickz84259.github.io/lolesports-api-docs/#section/Authentication/apiKeyAuth)
##### query Parameters  
| hl required   |  string (locale)  Enum:"en-US" "en-GB" "en-AU" "cs-CZ" "de-DE" "el-GR" "es-ES" "es-MX" "fr-FR" "hu-HU" "it-IT" "pl-PL" "pt-BR" "ro-RO" "ru-RU" "tr-TR" "ja-JP" "ko-KR" This is the locale or language code using [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) and [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)  |  
| --- | --- |  
| id  |  Array of strings The team slug(s). You can input more than one slug.  |  
###  Responses 
**200 **
Successful request
get /getTeams
https://esports-api.lolesports.com/persisted/gw/getTeams
https://prod-relapi.ewp.gg/persisted/gw/getTeams
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "data": {
    * "teams": [
      * {
        * "code": "string",
        * "image": "string",
        * "name": "string",
        * "id": "string",
        * "slug": "string",
        * "alternativeImage": "string",
        * "homeLeague": {
          * "name": "string",
          * "region": "string"
},
        * "players": [
          * {
            * "id": "string",
            * "summonerName": "string",
            * "firstName": "string",
            * "lastName": "string",
            * "image": "string",
            * "role": "string"
}
]
}
]
}

}
#  [](https://vickz84259.github.io/lolesports-api-docs/#tag/match-details)match details
Get the full match details of a game either live or after it has occured.
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getWindow)getWindow
##### path Parameters  
| gameId required   |  integer <int64> The game id of the match  |  
| --- | --- |  
##### query Parameters  
| startingTime  |  string <date-time> The date-time (RFC3339)  |  
| --- | --- |  
###  Responses 
**200 **
Successful request
get /window/{gameId}
https://feed.lolesports.com/livestats/v1/window/{gameId}
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "esportsGameId": "string",
  * "esportsMatchId": "string",
  * "gameMetadata": {
    * "patchVersion": "string",
    * "blueTeamMetadata": {
      * "esportsTeamId": "string",
      * "participantMetadata": [
        * {
          * "participantId": 1,
          * "summonerName": "string",
          * "championId": "string",
          * "role": "top"
}
]
},
    * "redTeamMetadata": {
      * "esportsTeamId": "string",
      * "participantMetadata": [
        * {
          * "participantId": 1,
          * "summonerName": "string",
          * "championId": "string",
          * "role": "top"
}
]
}
},
  * "frames": [
    * {
      * "rfc460Timestamp": "2019-07-13T16:33:07Z",
      * "gameState": "in_game",
      * "blueTeam": {
        * "totalGold": 0,
        * "inhibitors": 0,
        * "towers": 0,
        * "barons": 0,
        * "totalKills": 0,
        * "dragons": [
          * "ocean"
],
        * "participants": [
          * {
            * "participantId": 1,
            * "level": 0,
            * "kills": 0,
            * "deaths": 0,
            * "assists": 0,
            * "creepScore": 0,
            * "totalGold": 0,
            * "currentHealth": 0,
            * "maxHealth": 0
}
]
},
      * "redTeam": {
        * "totalGold": 0,
        * "inhibitors": 0,
        * "towers": 0,
        * "barons": 0,
        * "totalKills": 0,
        * "dragons": [
          * "ocean"
],
        * "participants": [
          * {
            * "participantId": 1,
            * "level": 0,
            * "kills": 0,
            * "deaths": 0,
            * "assists": 0,
            * "creepScore": 0,
            * "totalGold": 0,
            * "currentHealth": 0,
            * "maxHealth": 0
}
]
}
}
]

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/getDetails)getDetails
##### path Parameters  
| gameId required   |  integer <int64> The game id of the match  |  
| --- | --- |  
##### query Parameters  
| startingTime  |  string <date-time> The date-time (RFC3339)  |  
| --- | --- |  
| participantIds  |  string^\d{1,2}(?:_\d{1,2}){0,9}$ A list of the participant Ids separated by underscores and not commas  |  
###  Responses 
**200 **
Successful request
get /details/{gameId}
https://feed.lolesports.com/livestats/v1/details/{gameId}
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "frames": [
    * {
      * "rfc460Timestamp": "2019-07-13T16:33:07Z",
      * "participants": [
        * {
          * "participantId": 1,
          * "level": 0,
          * "kills": 0,
          * "deaths": 0,
          * "assists": 0,
          * "creepScore": 0,
          * "totalGold": 0,
          * "currentHealth": 0,
          * "maxHealth": 0,
          * "totalGoldEarned": 0,
          * "killParticipation": 0,
          * "championDamageShare": 0,
          * "wardsPlaced": 0,
          * "wardsDestroyed": 0,
          * "attackDamage": 0,
          * "abilityPower": 0,
          * "criticalChance": 0,
          * "attackSpeed": 0,
          * "lifeSteal": 0,
          * "armor": 0,
          * "magicResistance": 0,
          * "tenacity": 0,
          * "items": [
            * 0
],
          * "perkMetadata": {
            * "styleId": 8000,
            * "subStyleId": 8000,
            * "perks": [
              * 0,
              * 0,
              * 0,
              * 0,
              * 0,
              * 0,
              * 0,
              * 0,
              * 0
]
},
          * "abilities": "Q"
}
]
}
]

}
#  [](https://vickz84259.github.io/lolesports-api-docs/#tag/highlander)highlander
These are the old api endpoints.
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/navItems)navItems
###  Responses 
**200 **
Successful request
get /navItems
https://api.lolesports.com/api/v1/navItems
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "navItems": [
    * {
      * "id": 0,
      * "link": "string",
      * "slug": "string",
      * "label": "string",
      * "imageUrl": "string",
      * "order": 0,
      * "external": true,
      * "parentNavItem": { },
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z"
}
],
  * "leagues": [
    * {
      * "name": "string",
      * "slug": "string",
      * "id": 0,
      * "guid": "string",
      * "region": "string",
      * "drupalId": 0,
      * "logoUrl": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "abouts": {
        * "property1": "string",
        * "property2": "string"
},
      * "names": {
        * "property1": "string",
        * "property2": "string"
},
      * "tournaments": [
        * "string"
]
}
]

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/videos)videos
This endpoint returns details about esports vods on YouTube.
The data returned by this endpoint is fairly large (more than 5MB) since it includes vods from 2015 up to (at the time of writing this) June 2019 and it will continue growing.
Do consider this when dealing with clients (like mobile phones) where bandwidth and memory may be scarce.
It is highly advised that you cache the data from this endpoint.
###  Responses 
**200 **
Successful request
get /videos
https://api.lolesports.com/api/v2/videos
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "videos": [
    * {
      * "id": 0,
      * "slug": "string",
      * "label": "string",
      * "locale": "string",
      * "reference": "string",
      * "source": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "game": "string"
}
]

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/highlanderTournaments)highlanderTournaments
If a league does not have highlanderTournament objects, the API will return 404
##### query Parameters  
| league required   |  string <int32> The id of the league you want details of  |  
| --- | --- |  
###  Responses 
**200 **
Successful request
**404 **
Not Found
get /highlanderTournaments
https://api.lolesports.com/api/v2/highlanderTournaments
###  Response samples 
  * 200
  * 404


application/json
Copy
Expand all  Collapse all 
[
  * {
    * "id": "string",
    * "title": "string",
    * "description": "string",
    * "leagueReference": "string",
    * "roles": {
      * "creator": [
        * {
          * "origin": "BEARER_TOKEN",
          * "region": "global",
          * "summonerName": "test-user",
          * "summonerLevel": 0,
          * "profileIconId": 0,
          * "admin": true
}
],
      * "owner": [
        * {
          * "origin": "BEARER_TOKEN",
          * "region": "global",
          * "summonerName": "test-user",
          * "summonerLevel": 0,
          * "profileIconId": 0,
          * "admin": true
}
]
},
    * "bracketType": {
      * "identifier": "round_robin",
      * "options": {
        * "rounds": "string"
}
},
    * "matchType": {
      * "identifier": "bestOf",
      * "options": {
        * "best_of": "string"
}
},
    * "rosteringStrategy": {
      * "identifier": "passthru"
},
    * "seedingStrategy": {
      * "identifier": "passthru"
},
    * "queues": { },
    * "rosters": {
      * "property1": {
        * "id": "string",
        * "state": "eliminated",
        * "name": "string",
        * "roles": { },
        * "teamReference": "string",
        * "substitutions": { },
        * "team": "string"
},
      * "property2": {
        * "id": "string",
        * "state": "eliminated",
        * "name": "string",
        * "roles": { },
        * "teamReference": "string",
        * "substitutions": { },
        * "team": "string"
}
},
    * "published": true,
    * "breakpoints": {
      * "property1": {
        * "id": "string",
        * "name": "string",
        * "position": 0,
        * "input": [
          * {
            * "roster": "string",
            * "bracket": "string",
            * "standing": 0
}
],
        * "standings": {
          * "result": [
            * [
              * {
                * "roster": "string"
}
]
],
          * "timestamp": 0,
          * "source": "manual",
          * "note": "string",
          * "history": [
            * { }
],
          * "closed": true
},
        * "scores": {
          * "property1": 0,
          * "property2": 0
},
        * "roles": {
          * "creator": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
],
          * "owner": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
]
},
        * "generator": {
          * "identifier": "noop"
}
},
      * "property2": {
        * "id": "string",
        * "name": "string",
        * "position": 0,
        * "input": [
          * {
            * "roster": "string",
            * "bracket": "string",
            * "standing": 0
}
],
        * "standings": {
          * "result": [
            * [
              * {
                * "roster": "string"
}
]
],
          * "timestamp": 0,
          * "source": "manual",
          * "note": "string",
          * "history": [
            * { }
],
          * "closed": true
},
        * "scores": {
          * "property1": 0,
          * "property2": 0
},
        * "roles": {
          * "creator": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
],
          * "owner": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
]
},
        * "generator": {
          * "identifier": "noop"
}
}
},
    * "brackets": {
      * "property1": {
        * "id": "string",
        * "name": "string",
        * "position": 0,
        * "groupPosition": 0,
        * "groupName": "string",
        * "canManufacture": true,
        * "state": "resolved",
        * "bracketType": {
          * "identifier": "round_robin",
          * "options": {
            * "rounds": "string"
}
},
        * "matchType": {
          * "identifier": "bestOf",
          * "options": {
            * "best_of": "string"
}
},
        * "gameMode": {
          * "identifier": "lol:duel",
          * "requiredPlayers": 1,
          * "mapName": "summoner_rift"
},
        * "input": [
          * {
            * "roster": "string",
            * "breakpoint": "string",
            * "standing": 0
}
],
        * "matches": {
          * "property1": {
            * "id": "string",
            * "name": "string",
            * "position": 0,
            * "state": "resolved",
            * "groupPosition": 0,
            * "matchType": {
              * "identifier": "bestOf",
              * "options": {
                * "best_of": "string"
}
},
            * "gameMode": {
              * "identifier": "lol:duel",
              * "requiredPlayers": 1,
              * "mapName": "summoner_rift"
},
            * "input": [
              * {
                * "roster": "string",
                * "match": "string",
                * "standing": 0
}
],
            * "games": {
              * "property1": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
},
              * "property2": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
},
            * "standings": {
              * "result": [
                * [
                  * {
                    * "roster": "string"
}
]
],
              * "timestamp": 0,
              * "source": "manual",
              * "note": "string",
              * "history": [
                * { }
],
              * "closed": true
},
            * "tiebreaker": true,
            * "remadeGames": [
              * {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
],
            * "roles": {
              * "creator": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
],
              * "owner": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
]
},
            * "scoring": {
              * "identifier": "standard",
              * "options": {
                * "points": [
                  * 0,
                  * 0
]
}
},
            * "scores": {
              * "property1": 0,
              * "property2": 0
}
},
          * "property2": {
            * "id": "string",
            * "name": "string",
            * "position": 0,
            * "state": "resolved",
            * "groupPosition": 0,
            * "matchType": {
              * "identifier": "bestOf",
              * "options": {
                * "best_of": "string"
}
},
            * "gameMode": {
              * "identifier": "lol:duel",
              * "requiredPlayers": 1,
              * "mapName": "summoner_rift"
},
            * "input": [
              * {
                * "roster": "string",
                * "match": "string",
                * "standing": 0
}
],
            * "games": {
              * "property1": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
},
              * "property2": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
},
            * "standings": {
              * "result": [
                * [
                  * {
                    * "roster": "string"
}
]
],
              * "timestamp": 0,
              * "source": "manual",
              * "note": "string",
              * "history": [
                * { }
],
              * "closed": true
},
            * "tiebreaker": true,
            * "remadeGames": [
              * {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
],
            * "roles": {
              * "creator": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
],
              * "owner": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
]
},
            * "scoring": {
              * "identifier": "standard",
              * "options": {
                * "points": [
                  * 0,
                  * 0
]
}
},
            * "scores": {
              * "property1": 0,
              * "property2": 0
}
}
},
        * "standings": {
          * "result": [
            * [
              * {
                * "roster": "string"
}
]
],
          * "timestamp": 0,
          * "source": "manual",
          * "note": "string",
          * "history": [
            * { }
],
          * "closed": true
},
        * "inheritableMatchScoringStrategy": {
          * "identifier": "standard",
          * "options": {
            * "points": [
              * 0,
              * 0
]
}
},
        * "roles": {
          * "creator": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
],
          * "owner": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
]
},
        * "scoring": {
          * "identifier": "standard",
          * "options": {
            * "points": [
              * 0,
              * 0
]
}
},
        * "scores": {
          * "property1": 0,
          * "property2": 0
},
        * "matchScoring": {
          * "identifier": "standard",
          * "options": {
            * "points": [
              * 0,
              * 0
]
}
},
        * "matchScores": {
          * "property1": 0,
          * "property2": 0
}
},
      * "property2": {
        * "id": "string",
        * "name": "string",
        * "position": 0,
        * "groupPosition": 0,
        * "groupName": "string",
        * "canManufacture": true,
        * "state": "resolved",
        * "bracketType": {
          * "identifier": "round_robin",
          * "options": {
            * "rounds": "string"
}
},
        * "matchType": {
          * "identifier": "bestOf",
          * "options": {
            * "best_of": "string"
}
},
        * "gameMode": {
          * "identifier": "lol:duel",
          * "requiredPlayers": 1,
          * "mapName": "summoner_rift"
},
        * "input": [
          * {
            * "roster": "string",
            * "breakpoint": "string",
            * "standing": 0
}
],
        * "matches": {
          * "property1": {
            * "id": "string",
            * "name": "string",
            * "position": 0,
            * "state": "resolved",
            * "groupPosition": 0,
            * "matchType": {
              * "identifier": "bestOf",
              * "options": {
                * "best_of": "string"
}
},
            * "gameMode": {
              * "identifier": "lol:duel",
              * "requiredPlayers": 1,
              * "mapName": "summoner_rift"
},
            * "input": [
              * {
                * "roster": "string",
                * "match": "string",
                * "standing": 0
}
],
            * "games": {
              * "property1": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
},
              * "property2": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
},
            * "standings": {
              * "result": [
                * [
                  * {
                    * "roster": "string"
}
]
],
              * "timestamp": 0,
              * "source": "manual",
              * "note": "string",
              * "history": [
                * { }
],
              * "closed": true
},
            * "tiebreaker": true,
            * "remadeGames": [
              * {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
],
            * "roles": {
              * "creator": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
],
              * "owner": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
]
},
            * "scoring": {
              * "identifier": "standard",
              * "options": {
                * "points": [
                  * 0,
                  * 0
]
}
},
            * "scores": {
              * "property1": 0,
              * "property2": 0
}
},
          * "property2": {
            * "id": "string",
            * "name": "string",
            * "position": 0,
            * "state": "resolved",
            * "groupPosition": 0,
            * "matchType": {
              * "identifier": "bestOf",
              * "options": {
                * "best_of": "string"
}
},
            * "gameMode": {
              * "identifier": "lol:duel",
              * "requiredPlayers": 1,
              * "mapName": "summoner_rift"
},
            * "input": [
              * {
                * "roster": "string",
                * "match": "string",
                * "standing": 0
}
],
            * "games": {
              * "property1": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
},
              * "property2": {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
},
            * "standings": {
              * "result": [
                * [
                  * {
                    * "roster": "string"
}
]
],
              * "timestamp": 0,
              * "source": "manual",
              * "note": "string",
              * "history": [
                * { }
],
              * "closed": true
},
            * "tiebreaker": true,
            * "remadeGames": [
              * {
                * "id": "string",
                * "name": "string",
                * "generatedName": "string",
                * "state": "remade",
                * "gameMode": {
                  * "identifier": "lol:duel",
                  * "requiredPlayers": 1,
                  * "mapName": "summoner_rift"
},
                * "input": [
                  * {
                    * "roster": "string",
                    * "match": "string",
                    * "standing": 0
}
],
                * "standings": {
                  * "result": [
                    * [
                      * {
                        * "roster": "string"
}
]
],
                  * "timestamp": 0,
                  * "source": "manual",
                  * "note": "string",
                  * "history": [
                    * { }
],
                  * "closed": true
},
                * "scores": {
                  * "property1": 0,
                  * "property2": 0
},
                * "gameId": "string",
                * "gameRealm": "string",
                * "platformId": "string",
                * "revision": 0,
                * "roles": {
                  * "creator": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
],
                  * "owner": [
                    * {
                      * "origin": "BEARER_TOKEN",
                      * "region": "global",
                      * "summonerName": "test-user",
                      * "summonerLevel": 0,
                      * "profileIconId": 0,
                      * "admin": true
}
]
}
}
],
            * "roles": {
              * "creator": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
],
              * "owner": [
                * {
                  * "origin": "BEARER_TOKEN",
                  * "region": "global",
                  * "summonerName": "test-user",
                  * "summonerLevel": 0,
                  * "profileIconId": 0,
                  * "admin": true
}
]
},
            * "scoring": {
              * "identifier": "standard",
              * "options": {
                * "points": [
                  * 0,
                  * 0
]
}
},
            * "scores": {
              * "property1": 0,
              * "property2": 0
}
}
},
        * "standings": {
          * "result": [
            * [
              * {
                * "roster": "string"
}
]
],
          * "timestamp": 0,
          * "source": "manual",
          * "note": "string",
          * "history": [
            * { }
],
          * "closed": true
},
        * "inheritableMatchScoringStrategy": {
          * "identifier": "standard",
          * "options": {
            * "points": [
              * 0,
              * 0
]
}
},
        * "roles": {
          * "creator": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
],
          * "owner": [
            * {
              * "origin": "BEARER_TOKEN",
              * "region": "global",
              * "summonerName": "test-user",
              * "summonerLevel": 0,
              * "profileIconId": 0,
              * "admin": true
}
]
},
        * "scoring": {
          * "identifier": "standard",
          * "options": {
            * "points": [
              * 0,
              * 0
]
}
},
        * "scores": {
          * "property1": 0,
          * "property2": 0
},
        * "matchScoring": {
          * "identifier": "standard",
          * "options": {
            * "points": [
              * 0,
              * 0
]
}
},
        * "matchScores": {
          * "property1": 0,
          * "property2": 0
}
}
},
    * "standings": {
      * "result": [
        * [
          * {
            * "roster": "string"
}
]
],
      * "timestamp": 0,
      * "source": "manual",
      * "note": "string",
      * "history": [
        * { }
],
      * "closed": true
},
    * "liveMatches": [
      * "string"
],
    * "startDate": "2019-07-13",
    * "endDate": "2019-07-13",
    * "platformIds": [
      * "string"
],
    * "gameIds": [
      * "string"
],
    * "leagueId": "string",
    * "league": "string"
}

]
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/leagues)leagues
##### query Parameters  
| query required   |  object or object 'This endpoint requires either the id or the slug to be passed. If both are present then only the first one will be considered. _Due to a limitation in the OpenApi specification it is not possible to show the mutual exclusive nature that the query parameters in this endpoint require. The schema below is as close as a representation I could get in expressing the nature of the query parameters._ Check the examples below to help better understand the query parameters needed. **Example 1** `https://api.lolesports.com/api/v1/leagues?id=3` This will return the details for **LEC**. **Example 2** `https://api.lolesports.com/api/v1/leagues?slug=worlds` This will return the details for **Worlds** **Example 3** `https://api.lolesports.com/api/v1/leagues?id=3&slug=worlds` In such a scenario where both query parameters are used only the first will be considered, hence it will only return the details for **LEC**. **Example 4** `https://api.lolesports.com/api/v1/leagues` This is not valid. At least one of the two query parameters (id or slug) is required.'  |  
| --- | --- |  
###  Responses 
**200 **
Successful request
**404 **
Not Found
get /leagues
https://api.lolesports.com/api/v1/leagues
###  Response samples 
  * 200
  * 404


application/json
Copy
Expand all  Collapse all 
{
  * "leagues": [
    * {
      * "name": "string",
      * "slug": "string",
      * "id": 0,
      * "guid": "string",
      * "region": "string",
      * "drupalId": 0,
      * "logoUrl": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "abouts": {
        * "property1": "string",
        * "property2": "string"
},
      * "names": {
        * "property1": "string",
        * "property2": "string"
},
      * "tournaments": [
        * "string"
]
}
],
  * "highlanderTournaments": [
    * {
      * "id": "string",
      * "title": "string",
      * "description": "string",
      * "leagueReference": "string",
      * "roles": {
        * "creator": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
],
        * "owner": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
]
},
      * "bracketType": {
        * "identifier": "round_robin",
        * "options": {
          * "rounds": "string"
}
},
      * "matchType": {
        * "identifier": "bestOf",
        * "options": {
          * "best_of": "string"
}
},
      * "rosteringStrategy": {
        * "identifier": "passthru"
},
      * "seedingStrategy": {
        * "identifier": "passthru"
},
      * "queues": { },
      * "rosters": {
        * "property1": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
},
        * "property2": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
}
},
      * "published": true,
      * "breakpoints": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
}
},
      * "brackets": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
}
},
      * "standings": {
        * "result": [
          * [
            * {
              * "roster": "string"
}
]
],
        * "timestamp": 0,
        * "source": "manual",
        * "note": "string",
        * "history": [
          * { }
],
        * "closed": true
},
      * "liveMatches": [
        * "string"
],
      * "startDate": "2019-07-13",
      * "endDate": "2019-07-13",
      * "platformIds": [
        * "string"
],
      * "gameIds": [
        * "string"
],
      * "leagueId": "string",
      * "league": "string"
}
],
  * "highlanderRecords": [
    * {
      * "wins": 0,
      * "losses": 0,
      * "ties": 0,
      * "score": 0,
      * "roster": "string",
      * "tournament": "string",
      * "bracket": "string",
      * "id": "string"
}
],
  * "teams": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "guid": "string",
      * "teamPhotoUrl": "string",
      * "logoUrl": "string",
      * "acronym": "string",
      * "homeLeague": "string",
      * "altLogoUrl": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string"
},
      * "players": [
        * 0
],
      * "starters": [
        * 0
],
      * "subs": [
        * 0
]
}
],
  * "players": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "firstName": "string",
      * "LastName": "string",
      * "roleSlug": "string",
      * "photoUrl": "string",
      * "hometown": "string",
      * "region": "string",
      * "birthdate": "2019-07-13T16:33:07Z",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string",
        * "property1": "string",
        * "property2": "string"
},
      * "socialNetworks": {
        * "property1": "string",
        * "property2": "string"
},
      * "champions": [
        * {
          * "id": 0,
          * "playerId": 0,
          * "championId": 0,
          * "championKey": "string",
          * "championName": "string",
          * "createdAt": "2019-07-13T16:33:07Z",
          * "updatedAt": "2019-07-13T16:33:07Z"
}
]
}
]

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/scheduleItems)scheduleItems
##### query Parameters  
| leagueId required   |  integer <int32> The id of the league you want details of  |  
| --- | --- |  
###  Responses 
**200 **
Successful request
get /scheduleItems
https://api.lolesports.com/api/v1/scheduleItems
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "scheduleItems": [
    * {
      * "id": "string",
      * "scheduledTime": "2019-07-13T16:33:07Z",
      * "tags": {
        * "subBlockLabel": "string",
        * "blockLabel": "string",
        * "leagueLabel": "string",
        * "blockPrefix": "string",
        * "subBlockPrefix": "string",
        * "yearLabel": "string",
        * "stageLabel": "string",
        * "tournamentLabel": "string"
},
      * "tournament": "string",
      * "league": "string",
      * "content": "string",
      * "match": "string",
      * "bracket": "string"
}
],
  * "highlanderTournaments": [
    * {
      * "id": "string",
      * "title": "string",
      * "description": "string",
      * "leagueReference": "string",
      * "roles": {
        * "creator": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
],
        * "owner": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
]
},
      * "bracketType": {
        * "identifier": "round_robin",
        * "options": {
          * "rounds": "string"
}
},
      * "matchType": {
        * "identifier": "bestOf",
        * "options": {
          * "best_of": "string"
}
},
      * "rosteringStrategy": {
        * "identifier": "passthru"
},
      * "seedingStrategy": {
        * "identifier": "passthru"
},
      * "queues": { },
      * "rosters": {
        * "property1": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
},
        * "property2": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
}
},
      * "published": true,
      * "breakpoints": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
}
},
      * "brackets": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
}
},
      * "standings": {
        * "result": [
          * [
            * {
              * "roster": "string"
}
]
],
        * "timestamp": 0,
        * "source": "manual",
        * "note": "string",
        * "history": [
          * { }
],
        * "closed": true
},
      * "liveMatches": [
        * "string"
],
      * "startDate": "2019-07-13",
      * "endDate": "2019-07-13",
      * "platformIds": [
        * "string"
],
      * "gameIds": [
        * "string"
],
      * "leagueId": "string",
      * "league": "string"
}
],
  * "teams": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "guid": "string",
      * "teamPhotoUrl": "string",
      * "logoUrl": "string",
      * "acronym": "string",
      * "homeLeague": "string",
      * "altLogoUrl": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string"
},
      * "players": [
        * 0
],
      * "starters": [
        * 0
],
      * "subs": [
        * 0
]
}
],
  * "highlanderRecords": [
    * {
      * "wins": 0,
      * "losses": 0,
      * "ties": 0,
      * "score": 0,
      * "roster": "string",
      * "tournament": "string",
      * "bracket": "string",
      * "id": "string"
}
],
  * "players": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "firstName": "string",
      * "LastName": "string",
      * "roleSlug": "string",
      * "photoUrl": "string",
      * "hometown": "string",
      * "region": "string",
      * "birthdate": "2019-07-13T16:33:07Z",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string",
        * "property1": "string",
        * "property2": "string"
},
      * "socialNetworks": {
        * "property1": "string",
        * "property2": "string"
},
      * "champions": [
        * {
          * "id": 0,
          * "playerId": 0,
          * "championId": 0,
          * "championKey": "string",
          * "championName": "string",
          * "createdAt": "2019-07-13T16:33:07Z",
          * "updatedAt": "2019-07-13T16:33:07Z"
}
]
}
]

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/teams)teams
If the `teamStatsSummaries`, `teamRosterStats` and `teamStatsHistories` keys are not present, then the team did not take part in that particular tournament.
##### query Parameters  
| slug required   |  string The team slug.  |  
| --- | --- |  
| tournament required   |  string^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ The tournament ID.  |  
###  Responses 
**200 **
Successful request
get /teams
https://api.lolesports.com/api/v1/teams
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "players": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "firstName": "string",
      * "LastName": "string",
      * "roleSlug": "string",
      * "photoUrl": "string",
      * "hometown": "string",
      * "region": "string",
      * "birthdate": "2019-07-13T16:33:07Z",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string",
        * "property1": "string",
        * "property2": "string"
},
      * "socialNetworks": {
        * "property1": "string",
        * "property2": "string"
},
      * "champions": [
        * {
          * "id": 0,
          * "playerId": 0,
          * "championId": 0,
          * "championKey": "string",
          * "championName": "string",
          * "createdAt": "2019-07-13T16:33:07Z",
          * "updatedAt": "2019-07-13T16:33:07Z"
}
],
      * "teamRosterStat": "string"
}
],
  * "highlanderTournaments": [
    * {
      * "id": "string",
      * "title": "string",
      * "description": "string",
      * "leagueReference": "string",
      * "roles": {
        * "creator": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
],
        * "owner": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
]
},
      * "bracketType": {
        * "identifier": "round_robin",
        * "options": {
          * "rounds": "string"
}
},
      * "matchType": {
        * "identifier": "bestOf",
        * "options": {
          * "best_of": "string"
}
},
      * "rosteringStrategy": {
        * "identifier": "passthru"
},
      * "seedingStrategy": {
        * "identifier": "passthru"
},
      * "queues": { },
      * "rosters": {
        * "property1": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
},
        * "property2": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
}
},
      * "published": true,
      * "breakpoints": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
}
},
      * "brackets": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
}
},
      * "standings": {
        * "result": [
          * [
            * {
              * "roster": "string"
}
]
],
        * "timestamp": 0,
        * "source": "manual",
        * "note": "string",
        * "history": [
          * { }
],
        * "closed": true
},
      * "liveMatches": [
        * "string"
],
      * "startDate": "2019-07-13",
      * "endDate": "2019-07-13",
      * "platformIds": [
        * "string"
],
      * "gameIds": [
        * "string"
],
      * "leagueId": "string",
      * "league": "string"
}
],
  * "scheduleItems": [
    * {
      * "id": "string",
      * "scheduledTime": "2019-07-13T16:33:07Z",
      * "tags": {
        * "subBlockLabel": "string",
        * "blockLabel": "string",
        * "leagueLabel": "string",
        * "blockPrefix": "string",
        * "subBlockPrefix": "string",
        * "yearLabel": "string",
        * "stageLabel": "string",
        * "tournamentLabel": "string"
},
      * "tournament": "string",
      * "league": "string",
      * "content": "string",
      * "match": "string",
      * "bracket": "string"
}
],
  * "teamStatsSummaries": [
    * {
      * "teamId": "string",
      * "kdaRatio": 0,
      * "kdaRatioRank": 0,
      * "averageWinLength": 0,
      * "averageWinLengthRank": 0,
      * "firstDragonKillRatio": 0,
      * "firstDragonKillRatioRank": 0,
      * "firstTowerRatio": 0,
      * "firstTowerRatioRank": 0,
      * "averageDamageByPosition": {
        * "DUO_CARRY": 0,
        * "DUO_SUPPORT": 0,
        * "SOLO": 0,
        * "NONE": 0,
        * "DUO": 0
}
}
],
  * "teamRosterStats": [
    * {
      * "playerId": "string",
      * "gamesPlayed": 0,
      * "averageAssists": 0,
      * "averageDeaths": 0,
      * "averageKillParticipation": 0,
      * "averageKills": 0,
      * "summonerName": "string",
      * "championIds": [
        * 0
]
}
],
  * "teamStatsHistories": [
    * {
      * "id": "string",
      * "timestamp": 0,
      * "assists": 0,
      * "kills": 0,
      * "win": true,
      * "championIds": [
        * 0,
        * 0,
        * 0,
        * 0,
        * 0
],
      * "match": "string",
      * "team": 0,
      * "opponent": 0,
      * "game": 0
}
],
  * "teams": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "guid": "string",
      * "teamPhotoUrl": "string",
      * "logoUrl": "string",
      * "acronym": "string",
      * "homeLeague": "string",
      * "altLogoUrl": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string"
},
      * "players": [
        * 0
],
      * "starters": [
        * 0
],
      * "subs": [
        * 0
]
}
]

}
##  [](https://vickz84259.github.io/lolesports-api-docs/#operation/players)players
If the `playerStatsSummaries` and `playerStatsHistories` keys are not present, then the player did not take part in that particular tournament.
##### query Parameters  
| slug required   |  string The player slug.  |  
| --- | --- |  
| tournament required   |  string^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ The tournament ID.  |  
###  Responses 
**200 **
Successful request
get /players
https://api.lolesports.com/api/v1/players
###  Response samples 
  * 200


application/json
Copy
Expand all  Collapse all 
{
  * "players": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "firstName": "string",
      * "LastName": "string",
      * "roleSlug": "string",
      * "photoUrl": "string",
      * "hometown": "string",
      * "region": "string",
      * "birthdate": "2019-07-13T16:33:07Z",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string",
        * "property1": "string",
        * "property2": "string"
},
      * "socialNetworks": {
        * "property1": "string",
        * "property2": "string"
},
      * "champions": [
        * {
          * "id": 0,
          * "playerId": 0,
          * "championId": 0,
          * "championKey": "string",
          * "championName": "string",
          * "createdAt": "2019-07-13T16:33:07Z",
          * "updatedAt": "2019-07-13T16:33:07Z"
}
],
      * "starterOnTeams": [
        * 0
],
      * "subOnTeams": [
        * 0
],
      * "teams": [
        * 0
],
      * "photoInformation": {
        * "width": 0,
        * "height": 0,
        * "type": "string",
        * "url": "string",
        * "transferred": 0,
        * "size": 0,
        * "time": null
},
      * "scheduleItems": [
        * "string"
],
      * "playerStatsSummary": "string",
      * "playerStatsHistory": [
        * "string"
]
}
],
  * "highlanderTournaments": [
    * {
      * "id": "string",
      * "title": "string",
      * "description": "string",
      * "leagueReference": "string",
      * "roles": {
        * "creator": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
],
        * "owner": [
          * {
            * "origin": "BEARER_TOKEN",
            * "region": "global",
            * "summonerName": "test-user",
            * "summonerLevel": 0,
            * "profileIconId": 0,
            * "admin": true
}
]
},
      * "bracketType": {
        * "identifier": "round_robin",
        * "options": {
          * "rounds": "string"
}
},
      * "matchType": {
        * "identifier": "bestOf",
        * "options": {
          * "best_of": "string"
}
},
      * "rosteringStrategy": {
        * "identifier": "passthru"
},
      * "seedingStrategy": {
        * "identifier": "passthru"
},
      * "queues": { },
      * "rosters": {
        * "property1": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
},
        * "property2": {
          * "id": "string",
          * "state": "eliminated",
          * "name": "string",
          * "roles": { },
          * "teamReference": "string",
          * "substitutions": { },
          * "team": "string"
}
},
      * "published": true,
      * "breakpoints": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "input": [
            * {
              * "roster": "string",
              * "bracket": "string",
              * "standing": 0
}
],
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "generator": {
            * "identifier": "noop"
}
}
},
      * "brackets": {
        * "property1": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
},
        * "property2": {
          * "id": "string",
          * "name": "string",
          * "position": 0,
          * "groupPosition": 0,
          * "groupName": "string",
          * "canManufacture": true,
          * "state": "resolved",
          * "bracketType": {
            * "identifier": "round_robin",
            * "options": {
              * "rounds": "string"
}
},
          * "matchType": {
            * "identifier": "bestOf",
            * "options": {
              * "best_of": "string"
}
},
          * "gameMode": {
            * "identifier": "lol:duel",
            * "requiredPlayers": 1,
            * "mapName": "summoner_rift"
},
          * "input": [
            * {
              * "roster": "string",
              * "breakpoint": "string",
              * "standing": 0
}
],
          * "matches": {
            * "property1": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
},
            * "property2": {
              * "id": "string",
              * "name": "string",
              * "position": 0,
              * "state": "resolved",
              * "groupPosition": 0,
              * "matchType": {
                * "identifier": "bestOf",
                * "options": {
                  * "best_of": "string"
}
},
              * "gameMode": {
                * "identifier": "lol:duel",
                * "requiredPlayers": 1,
                * "mapName": "summoner_rift"
},
              * "input": [
                * {
                  * "roster": "string",
                  * "match": "string",
                  * "standing": 0
}
],
              * "games": {
                * "property1": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
},
                * "property2": {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
},
              * "standings": {
                * "result": [
                  * [
                    * {
                      * "roster": "string"
}
]
],
                * "timestamp": 0,
                * "source": "manual",
                * "note": "string",
                * "history": [
                  * { }
],
                * "closed": true
},
              * "tiebreaker": true,
              * "remadeGames": [
                * {
                  * "id": "string",
                  * "name": "string",
                  * "generatedName": "string",
                  * "state": "remade",
                  * "gameMode": {
                    * "identifier": "lol:duel",
                    * "requiredPlayers": 1,
                    * "mapName": "summoner_rift"
},
                  * "input": [
                    * {
                      * "roster": "string",
                      * "match": "string",
                      * "standing": 0
}
],
                  * "standings": {
                    * "result": [
                      * [
                        * {
                          * "roster": "string"
}
]
],
                    * "timestamp": 0,
                    * "source": "manual",
                    * "note": "string",
                    * "history": [
                      * { }
],
                    * "closed": true
},
                  * "scores": {
                    * "property1": 0,
                    * "property2": 0
},
                  * "gameId": "string",
                  * "gameRealm": "string",
                  * "platformId": "string",
                  * "revision": 0,
                  * "roles": {
                    * "creator": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
],
                    * "owner": [
                      * {
                        * "origin": "BEARER_TOKEN",
                        * "region": "global",
                        * "summonerName": "test-user",
                        * "summonerLevel": 0,
                        * "profileIconId": 0,
                        * "admin": true
}
]
}
}
],
              * "roles": {
                * "creator": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
],
                * "owner": [
                  * {
                    * "origin": "BEARER_TOKEN",
                    * "region": "global",
                    * "summonerName": "test-user",
                    * "summonerLevel": 0,
                    * "profileIconId": 0,
                    * "admin": true
}
]
},
              * "scoring": {
                * "identifier": "standard",
                * "options": {
                  * "points": [
                    * 0,
                    * 0
]
}
},
              * "scores": {
                * "property1": 0,
                * "property2": 0
}
}
},
          * "standings": {
            * "result": [
              * [
                * {
                  * "roster": "string"
}
]
],
            * "timestamp": 0,
            * "source": "manual",
            * "note": "string",
            * "history": [
              * { }
],
            * "closed": true
},
          * "inheritableMatchScoringStrategy": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "roles": {
            * "creator": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
],
            * "owner": [
              * {
                * "origin": "BEARER_TOKEN",
                * "region": "global",
                * "summonerName": "test-user",
                * "summonerLevel": 0,
                * "profileIconId": 0,
                * "admin": true
}
]
},
          * "scoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "scores": {
            * "property1": 0,
            * "property2": 0
},
          * "matchScoring": {
            * "identifier": "standard",
            * "options": {
              * "points": [
                * 0,
                * 0
]
}
},
          * "matchScores": {
            * "property1": 0,
            * "property2": 0
}
}
},
      * "standings": {
        * "result": [
          * [
            * {
              * "roster": "string"
}
]
],
        * "timestamp": 0,
        * "source": "manual",
        * "note": "string",
        * "history": [
          * { }
],
        * "closed": true
},
      * "liveMatches": [
        * "string"
],
      * "startDate": "2019-07-13",
      * "endDate": "2019-07-13",
      * "platformIds": [
        * "string"
],
      * "gameIds": [
        * "string"
],
      * "leagueId": "string",
      * "league": "string"
}
],
  * "scheduleItems": [
    * {
      * "id": "string",
      * "scheduledTime": "2019-07-13T16:33:07Z",
      * "tags": {
        * "subBlockLabel": "string",
        * "blockLabel": "string",
        * "leagueLabel": "string",
        * "blockPrefix": "string",
        * "subBlockPrefix": "string",
        * "yearLabel": "string",
        * "stageLabel": "string",
        * "tournamentLabel": "string"
},
      * "tournament": "string",
      * "league": "string",
      * "content": "string",
      * "match": "string",
      * "bracket": "string"
}
],
  * "teams": [
    * {
      * "id": 0,
      * "slug": "string",
      * "name": "string",
      * "guid": "string",
      * "teamPhotoUrl": "string",
      * "logoUrl": "string",
      * "acronym": "string",
      * "homeLeague": "string",
      * "altLogoUrl": "string",
      * "createdAt": "2019-07-13T16:33:07Z",
      * "updatedAt": "2019-07-13T16:33:07Z",
      * "bios": {
        * "property1": "string",
        * "property2": "string"
},
      * "foreignIds": {
        * "drupalId": "string"
},
      * "players": [
        * 0
],
      * "starters": [
        * 0
],
      * "subs": [
        * 0
]
}
],
  * "playerStatsSummaries": [
    * {
      * "playerId": "string",
      * "kdaRatio": 0,
      * "kdaRatioRank": 0,
      * "csPerTenMinutes": 0,
      * "csPerTenMinutesRank": 0,
      * "killParticipation": 0,
      * "killParticipationRank": 0,
      * "mostplayedchampions": [
        * {
          * "championId": 0,
          * "wins": 0,
          * "losses": 0,
          * "total": 0,
          * "kdaRatio": 0
}
]
}
],
  * "playerStatsHistories": [
    * {
      * "id": "string",
      * "playerId": "string",
      * "championId": 0,
      * "timestamp": 0,
      * "assists": 0,
      * "deaths": 0,
      * "kills": 0,
      * "csPerTenMinutes": 0,
      * "kdaRatio": 0,
      * "killParticipation": 0,
      * "win": true,
      * "match": "string",
      * "team": 0,
      * "opponent": 0,
      * "game": "string"
}
]

}
