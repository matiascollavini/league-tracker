{"html": "\n 
\n 
  * \n\n \n 
\n\n \n\n \n 
#### The AMERICAS routing value serves NA, BR, LAN and LAS. The ASIA routing value serves KR and JP. The EUROPE routing value serves EUNE, EUW, ME1, TR and RU. The SEA routing value serves OCE, SG2, TW2 and VN2.  
  

\n \n\n 
## [match-v5](https://developer.riotgames.com/api-details/\\"#match-v5\\")
\n \n \n 
    * [Collapse Operations](https://developer.riotgames.com/api-details/\\"#\\")
\n 
    * [Expand Operations](https://developer.riotgames.com/api-details/\\"#\\")
\n \n 
\n \n 
    * \n \n \n\n\n 
      * \n 
\n \n [GET](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatchIdsByPUUID\\")\n \n \n [/lol/match/v5/matches/by-puuid/{puuid}/ids](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatchIdsByPUUID\\")\n \n \n 
        * [Get a list of match ids by puuid](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatchIdsByPUUID\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatchIdsByPUUID\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: List[string] 
\n \n 
\n \n\n\n\n
* * *
\n\n 
\n\n 
\n 
#### Response Errors
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n  
| HTTP Status Code  | Reason  |  
| --- | --- |  
| 400  | Bad request  |  
| 401  | Unauthorized  |  
| 403  | Forbidden  |  
| 404  | Data not found  |  
| 405  | Method not allowed  |  
| 415  | Unsupported media type  |  
| 429  | Rate limit exceeded  |  
| 500  | Internal server error  |  
| 502  | Bad gateway  |  
| 503  | Service unavailable  |  
| 504  | Gateway timeout  |  
\n\n 
\n\n 
\n\n \n \n \n \n \n\n \n\n \n \n 
\n 
#### Path Parameters
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n puuid\n  required \n   | \n \n \n \n   | \n \n \n String\n \n \n   |   |  
\n
\n\n \n\n \n \n 
\n 
#### Query Parameters
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n startTime\n  optional \n   | \n \n \n \n   | \n \n \n long\n \n \n   | Epoch timestamp in seconds. The matchlist started storing timestamps on June 16th, 2021. Any matches played before June 16th, 2021 won't be included in the results if the startTime filter is set.  |  
| \n endTime\n  optional \n   | \n \n \n \n   | \n \n \n long\n \n \n   | Epoch timestamp in seconds.  |  
| \n queue\n  optional \n   | \n \n \n \n   | \n \n \n int\n \n \n   | Filter the list of match ids by a specific queue id. This filter is mutually inclusive of the type filter meaning any match ids returned must match both the queue and type filters.  |  
| \n type\n  optional \n   | \n \n \n\n \n \n \n\n \n \n ranked\n \n \n \n  normal\n \n \n \n  tourney\n \n \n \n  tutorial\n \n \n\n \n \n   | \n \n \n string\n \n \n   | Filter the list of match ids by the type of match. This filter is mutually inclusive of the queue filter meaning any match ids returned must match both the queue and type filters.  |  
| \n start\n  optional \n   | \n \n \n \n   | \n \n \n int\n \n \n   | Defaults to 0. Start index.  |  
| \n count\n  optional \n   | \n \n \n \n   | \n \n \n int\n \n \n   | Defaults to 20. Valid values: 0 to 100. Number of match ids to return.  |  
\n
\n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n SEA\n \n \n \n \n\n 
\n\n \n\n 
\n 
#### \n Include API key\n (?)\n 
\n\n 
\n Including an API key as a **query** param allows for easy debugging in the browser.\n   
\n Including an API key as a **header** param, avoids accidentally copy/pasting your API key in public.\n 
\n\n 
\n \n  Query Param\n \n 
\n 
\n \n  Header Param\n \n 
\n 
\n \n  Not required\n \n 
\n 
\n 
* * *
\n\n \n 
\n 
You must [login](https://developer.riotgames.com/api-details/\\"/login\\") to execute APIs through this page.
\n \n 
\n \n \n 
\n\n 
\n\n 
\n 
#### Request URL
\n \n 
\n\n 
\n 
#### Request Body
\n \n 
\n\n 
\n 
#### Request Headers
\n \n 
\n\n 
\n 
#### Response Code
\n \n 
\n\n 
\n 
#### Response Headers
\n \n 
\n\n 
\n 
#### Response Body
\n \n 
\n 
\n
\n\n 
\n\n 
      * \n 
\n \n [GET](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getReplayByAccessToken\\")\n \n \n [/lol/match/v5/matches/replays](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getReplayByAccessToken\\")\n \n \n 
        * [Get player replays by access token](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getReplayByAccessToken\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getReplayByAccessToken\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: ReplayDTO 
\n \n 
\n \n\n\n
\n 
##### ReplayDTO 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| total  | \n \n int\n \n   | Total of replay files\n \n   |  
| matchFileURLs  | \n \n List[string]\n \n   | Replay files URL (.rofl)\n \n   |  
\n
\n\n\n
* * *
\n\n 
\n\n 
\n 
#### Response Errors
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n  
| HTTP Status Code  | Reason  |  
| --- | --- |  
| 400  | Bad request  |  
| 401  | Unauthorized  |  
| 403  | Forbidden  |  
| 404  | Data not found  |  
| 405  | Method not allowed  |  
| 415  | Unsupported media type  |  
| 429  | Rate limit exceeded  |  
| 500  | Internal server error  |  
| 502  | Bad gateway  |  
| 503  | Service unavailable  |  
| 504  | Gateway timeout  |  
\n\n 
\n\n 
\n\n \n \n \n \n \n\n \n \n 
\n 
#### Header Parameters
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n Authorization\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n SEA\n \n \n \n \n\n 
\n\n \n\n 
\n 
#### \n Include API key\n (?)\n 
\n\n 
\n Including an API key as a **query** param allows for easy debugging in the browser.\n   
\n Including an API key as a **header** param, avoids accidentally copy/pasting your API key in public.\n 
\n\n 
\n \n  Query Param\n \n 
\n 
\n \n  Header Param\n \n 
\n 
\n \n  Not required\n \n 
\n 
\n 
* * *
\n\n \n 
\n 
You must [login](https://developer.riotgames.com/api-details/\\"/login\\") to execute APIs through this page.
\n \n 
\n \n \n 
\n\n 
\n\n 
\n 
#### Request URL
\n \n 
\n\n 
\n 
#### Request Body
\n \n 
\n\n 
\n 
#### Request Headers
\n \n 
\n\n 
\n 
#### Response Code
\n \n 
\n\n 
\n 
#### Response Headers
\n \n 
\n\n 
\n 
#### Response Body
\n \n 
\n 
\n
\n\n 
\n\n 
      * \n 
\n \n [GET](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatch\\")\n \n \n [/lol/match/v5/matches/{matchId}](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatch\\")\n \n \n 
        * [Get a match by match id](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatch\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getMatch\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: MatchDto 
\n \n 
\n \n\n\n
\n 
##### MatchDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| metadata  | \n \n MetadataDto\n \n   | Match metadata.\n \n   |  
| info  | \n \n InfoDto\n \n   | Match info.\n \n   |  
\n
\n\n
\n 
##### MetadataDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| dataVersion  | \n \n string\n \n   | Match data version.\n \n   |  
| matchId  | \n \n string\n \n   | Match id.\n \n   |  
| participants  | \n \n List[string]\n \n   | A list of participant PUUIDs.\n \n   |  
\n
\n\n
\n 
##### InfoDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| endOfGameResult  | \n \n string\n \n   | Refer to indicate if the game ended in termination.\n \n   |  
| gameCreation  | \n \n long\n \n   | Unix timestamp for when the game is created on the game server (i.e., the loading screen).\n \n   |  
| gameDuration  | \n \n long\n \n   | Prior to patch 11.20, this field returns the game length in milliseconds calculated from gameEndTimestamp - gameStartTimestamp. Post patch 11.20, this field returns the max timePlayed of any participant in the game in seconds, which makes the behavior of this field consistent with that of match-v4. The best way to handling the change in this field is to treat the value as milliseconds if the gameEndTimestamp field isn't in the response and to treat the value as seconds if gameEndTimestamp is in the response.\n \n   |  
| gameEndTimestamp  | \n \n long\n \n   | Unix timestamp for when match ends on the game server. This timestamp can occasionally be significantly longer than when the match "ends". The most reliable way of determining the timestamp for the end of the match would be to add the max time played of any participant to the gameStartTimestamp. This field was added to match-v5 in patch 11.20 on Oct 5th, 2021.\n \n   |  
| gameId  | \n \n long\n \n   | \n \n   |  
| gameMode  | \n \n string\n \n   | Refer to the Game Constants documentation.\n \n   |  
| gameName  | \n \n string\n \n   | \n \n   |  
| gameStartTimestamp  | \n \n long\n \n   | Unix timestamp for when match starts on the game server.\n \n   |  
| gameType  | \n \n string\n \n   | \n \n   |  
| gameVersion  | \n \n string\n \n   | The first two parts can be used to determine the patch a game was played on.\n \n   |  
| mapId  | \n \n int\n \n   | Refer to the Game Constants documentation.\n \n   |  
| participants  | \n \n List[ParticipantDto]\n \n   | \n \n   |  
| platformId  | \n \n string\n \n   | Platform where the match was played.\n \n   |  
| queueId  | \n \n int\n \n   | Refer to the Game Constants documentation.\n \n   |  
| teams  | \n \n List[TeamDto]\n \n   | \n \n   |  
| tournamentCode  | \n \n string\n \n   | Tournament code used to generate the match. This field was added to match-v5 in patch 11.13 on June 23rd, 2021.\n \n   |  
\n
\n\n
\n 
##### ParticipantDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| allInPings  | \n \n int\n \n   | Yellow crossed swords\n \n   |  
| assistMePings  | \n \n int\n \n   | Green flag\n \n   |  
| assists  | \n \n int\n \n   | \n \n   |  
| baronKills  | \n \n int\n \n   | \n \n   |  
| bountyLevel  | \n \n int\n \n   | \n \n   |  
| champExperience  | \n \n int\n \n   | \n \n   |  
| champLevel  | \n \n int\n \n   | \n \n   |  
| championId  | \n \n int\n \n   | Prior to patch 11.4, on Feb 18th, 2021, this field returned invalid championIds. We recommend determining the champion based on the championName field for matches played prior to patch 11.4.\n \n   |  
| championName  | \n \n string\n \n   | \n \n   |  
| commandPings  | \n \n int\n \n   | Blue generic ping (ALT+click)\n \n   |  
| championTransform  | \n \n int\n \n   | This field is currently only utilized for Kayn's transformations. (Legal values: 0 - None, 1 - Slayer, 2 - Assassin)\n \n   |  
| consumablesPurchased  | \n \n int\n \n   | \n \n   |  
| challenges  | \n \n ChallengesDto\n \n   | \n \n   |  
| damageDealtToBuildings  | \n \n int\n \n   | \n \n   |  
| damageDealtToObjectives  | \n \n int\n \n   | \n \n   |  
| damageDealtToTurrets  | \n \n int\n \n   | \n \n   |  
| damageSelfMitigated  | \n \n int\n \n   | \n \n   |  
| deaths  | \n \n int\n \n   | \n \n   |  
| detectorWardsPlaced  | \n \n int\n \n   | \n \n   |  
| doubleKills  | \n \n int\n \n   | \n \n   |  
| dragonKills  | \n \n int\n \n   | \n \n   |  
| eligibleForProgression  | \n \n boolean\n \n   | \n \n   |  
| enemyMissingPings  | \n \n int\n \n   | Yellow questionmark\n \n   |  
| enemyVisionPings  | \n \n int\n \n   | Red eyeball\n \n   |  
| firstBloodAssist  | \n \n boolean\n \n   | \n \n   |  
| firstBloodKill  | \n \n boolean\n \n   | \n \n   |  
| firstTowerAssist  | \n \n boolean\n \n   | \n \n   |  
| firstTowerKill  | \n \n boolean\n \n   | \n \n   |  
| gameEndedInEarlySurrender  | \n \n boolean\n \n   | This is an offshoot of the OneStone challenge. The code checks if a spell with the same instance ID does the final point of damage to at least 2 Champions. It doesn't matter if they're enemies, but you cannot hurt your friends.\n \n   |  
| gameEndedInSurrender  | \n \n boolean\n \n   | \n \n   |  
| holdPings  | \n \n int\n \n   | \n \n   |  
| getBackPings  | \n \n int\n \n   | Yellow circle with horizontal line\n \n   |  
| goldEarned  | \n \n int\n \n   | \n \n   |  
| goldSpent  | \n \n int\n \n   | \n \n   |  
| individualPosition  | \n \n string\n \n   | Both individualPosition and teamPosition are computed by the game server and are different versions of the most likely position played by a player. The individualPosition is the best guess for which position the player actually played in isolation of anything else. The teamPosition is the best guess for which position the player actually played if we add the constraint that each team must have one top player, one jungle, one middle, etc. Generally the recommendation is to use the teamPosition field over the individualPosition field.\n \n   |  
| inhibitorKills  | \n \n int\n \n   | \n \n   |  
| inhibitorTakedowns  | \n \n int\n \n   | \n \n   |  
| inhibitorsLost  | \n \n int\n \n   | \n \n   |  
| item0  | \n \n int\n \n   | \n \n   |  
| item1  | \n \n int\n \n   | \n \n   |  
| item2  | \n \n int\n \n   | \n \n   |  
| item3  | \n \n int\n \n   | \n \n   |  
| item4  | \n \n int\n \n   | \n \n   |  
| item5  | \n \n int\n \n   | \n \n   |  
| item6  | \n \n int\n \n   | \n \n   |  
| itemsPurchased  | \n \n int\n \n   | \n \n   |  
| killingSprees  | \n \n int\n \n   | \n \n   |  
| kills  | \n \n int\n \n   | \n \n   |  
| lane  | \n \n string\n \n   | \n \n   |  
| largestCriticalStrike  | \n \n int\n \n   | \n \n   |  
| largestKillingSpree  | \n \n int\n \n   | \n \n   |  
| largestMultiKill  | \n \n int\n \n   | \n \n   |  
| longestTimeSpentLiving  | \n \n int\n \n   | \n \n   |  
| magicDamageDealt  | \n \n int\n \n   | \n \n   |  
| magicDamageDealtToChampions  | \n \n int\n \n   | \n \n   |  
| magicDamageTaken  | \n \n int\n \n   | \n \n   |  
| missions  | \n \n MissionsDto\n \n   | \n \n   |  
| neutralMinionsKilled  | \n \n int\n \n   | neutralMinionsKilled = mNeutralMinionsKilled, which is incremented on kills of kPet and kJungleMonster\n \n   |  
| needVisionPings  | \n \n int\n \n   | Green ward\n \n   |  
| nexusKills  | \n \n int\n \n   | \n \n   |  
| nexusTakedowns  | \n \n int\n \n   | \n \n   |  
| nexusLost  | \n \n int\n \n   | \n \n   |  
| objectivesStolen  | \n \n int\n \n   | \n \n   |  
| objectivesStolenAssists  | \n \n int\n \n   | \n \n   |  
| onMyWayPings  | \n \n int\n \n   | Blue arrow pointing at ground\n \n   |  
| participantId  | \n \n int\n \n   | \n \n   |  
| playerScore0  | \n \n int\n \n   | \n \n   |  
| playerScore1  | \n \n int\n \n   | \n \n   |  
| playerScore2  | \n \n int\n \n   | \n \n   |  
| playerScore3  | \n \n int\n \n   | \n \n   |  
| playerScore4  | \n \n int\n \n   | \n \n   |  
| playerScore5  | \n \n int\n \n   | \n \n   |  
| playerScore6  | \n \n int\n \n   | \n \n   |  
| playerScore7  | \n \n int\n \n   | \n \n   |  
| playerScore8  | \n \n int\n \n   | \n \n   |  
| playerScore9  | \n \n int\n \n   | \n \n   |  
| playerScore10  | \n \n int\n \n   | \n \n   |  
| playerScore11  | \n \n int\n \n   | \n \n   |  
| pentaKills  | \n \n int\n \n   | \n \n   |  
| perks  | \n \n PerksDto\n \n   | \n \n   |  
| physicalDamageDealt  | \n \n int\n \n   | \n \n   |  
| physicalDamageDealtToChampions  | \n \n int\n \n   | \n \n   |  
| physicalDamageTaken  | \n \n int\n \n   | \n \n   |  
| placement  | \n \n int\n \n   | \n \n   |  
| playerAugment1  | \n \n int\n \n   | \n \n   |  
| playerAugment2  | \n \n int\n \n   | \n \n   |  
| playerAugment3  | \n \n int\n \n   | \n \n   |  
| playerAugment4  | \n \n int\n \n   | \n \n   |  
| playerSubteamId  | \n \n int\n \n   | \n \n   |  
| pushPings  | \n \n int\n \n   | Green minion\n \n   |  
| profileIcon  | \n \n int\n \n   | \n \n   |  
| puuid  | \n \n string\n \n   | \n \n   |  
| quadraKills  | \n \n int\n \n   | \n \n   |  
| riotIdGameName  | \n \n string\n \n   | \n \n   |  
| riotIdTagline  | \n \n string\n \n   | \n \n   |  
| role  | \n \n string\n \n   | \n \n   |  
| sightWardsBoughtInGame  | \n \n int\n \n   | \n \n   |  
| spell1Casts  | \n \n int\n \n   | \n \n   |  
| spell2Casts  | \n \n int\n \n   | \n \n   |  
| spell3Casts  | \n \n int\n \n   | \n \n   |  
| spell4Casts  | \n \n int\n \n   | \n \n   |  
| subteamPlacement  | \n \n int\n \n   | \n \n   |  
| summoner1Casts  | \n \n int\n \n   | \n \n   |  
| summoner1Id  | \n \n int\n \n   | \n \n   |  
| summoner2Casts  | \n \n int\n \n   | \n \n   |  
| summoner2Id  | \n \n int\n \n   | \n \n   |  
| summonerId  | \n \n string\n \n   | \n \n   |  
| summonerLevel  | \n \n int\n \n   | \n \n   |  
| summonerName  | \n \n string\n \n   | \n \n   |  
| teamEarlySurrendered  | \n \n boolean\n \n   | \n \n   |  
| teamId  | \n \n int\n \n   | \n \n   |  
| teamPosition  | \n \n string\n \n   | Both individualPosition and teamPosition are computed by the game server and are different versions of the most likely position played by a player. The individualPosition is the best guess for which position the player actually played in isolation of anything else. The teamPosition is the best guess for which position the player actually played if we add the constraint that each team must have one top player, one jungle, one middle, etc. Generally the recommendation is to use the teamPosition field over the individualPosition field.\n \n   |  
| timeCCingOthers  | \n \n int\n \n   | \n \n   |  
| timePlayed  | \n \n int\n \n   | \n \n   |  
| totalAllyJungleMinionsKilled  | \n \n int\n \n   | \n \n   |  
| totalDamageDealt  | \n \n int\n \n   | \n \n   |  
| totalDamageDealtToChampions  | \n \n int\n \n   | \n \n   |  
| totalDamageShieldedOnTeammates  | \n \n int\n \n   | \n \n   |  
| totalDamageTaken  | \n \n int\n \n   | \n \n   |  
| totalEnemyJungleMinionsKilled  | \n \n int\n \n   | \n \n   |  
| totalHeal  | \n \n int\n \n   | Whenever positive health is applied (which translates to all heals in the game but not things like regeneration), totalHeal is incremented by the amount of health received. This includes healing enemies, jungle monsters, yourself, etc\n \n   |  
| totalHealsOnTeammates  | \n \n int\n \n   | Whenever positive health is applied (which translates to all heals in the game but not things like regeneration), totalHealsOnTeammates is incremented by the amount of health received. This is post modified, so if you heal someone missing 5 health for 100 you will get +5 totalHealsOnTeammates\n \n   |  
| totalMinionsKilled  | \n \n int\n \n   | totalMillionsKilled = mMinionsKilled, which is only incremented on kills of kTeamMinion, kMeleeLaneMinion, kSuperLaneMinion, kRangedLaneMinion and kSiegeLaneMinion\n \n   |  
| totalTimeCCDealt  | \n \n int\n \n   | \n \n   |  
| totalTimeSpentDead  | \n \n int\n \n   | \n \n   |  
| totalUnitsHealed  | \n \n int\n \n   | \n \n   |  
| tripleKills  | \n \n int\n \n   | \n \n   |  
| trueDamageDealt  | \n \n int\n \n   | \n \n   |  
| trueDamageDealtToChampions  | \n \n int\n \n   | \n \n   |  
| trueDamageTaken  | \n \n int\n \n   | \n \n   |  
| turretKills  | \n \n int\n \n   | \n \n   |  
| turretTakedowns  | \n \n int\n \n   | \n \n   |  
| turretsLost  | \n \n int\n \n   | \n \n   |  
| unrealKills  | \n \n int\n \n   | \n \n   |  
| visionScore  | \n \n int\n \n   | \n \n   |  
| visionClearedPings  | \n \n int\n \n   | \n \n   |  
| visionWardsBoughtInGame  | \n \n int\n \n   | \n \n   |  
| wardsKilled  | \n \n int\n \n   | \n \n   |  
| wardsPlaced  | \n \n int\n \n   | \n \n   |  
| win  | \n \n boolean\n \n   | \n \n   |  
\n
\n\n
\n 
##### ChallengesDto 
\n \n - Challenges DTO\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| 12AssistStreakCount  | \n \n integer\n \n   | \n \n   |  
| baronBuffGoldAdvantageOverThreshold  | \n \n integer\n \n   | \n \n   |  
| controlWardTimeCoverageInRiverOrEnemyHalf  | \n \n float\n \n   | \n \n   |  
| earliestBaron  | \n \n integer\n \n   | \n \n   |  
| earliestDragonTakedown  | \n \n integer\n \n   | \n \n   |  
| earliestElderDragon  | \n \n integer\n \n   | \n \n   |  
| earlyLaningPhaseGoldExpAdvantage  | \n \n integer\n \n   | \n \n   |  
| fasterSupportQuestCompletion  | \n \n integer\n \n   | \n \n   |  
| fastestLegendary  | \n \n integer\n \n   | \n \n   |  
| hadAfkTeammate  | \n \n integer\n \n   | \n \n   |  
| highestChampionDamage  | \n \n integer\n \n   | \n \n   |  
| highestCrowdControlScore  | \n \n integer\n \n   | \n \n   |  
| highestWardKills  | \n \n integer\n \n   | \n \n   |  
| junglerKillsEarlyJungle  | \n \n integer\n \n   | \n \n   |  
| killsOnLanersEarlyJungleAsJungler  | \n \n integer\n \n   | \n \n   |  
| laningPhaseGoldExpAdvantage  | \n \n integer\n \n   | \n \n   |  
| legendaryCount  | \n \n integer\n \n   | \n \n   |  
| maxCsAdvantageOnLaneOpponent  | \n \n float\n \n   | \n \n   |  
| maxLevelLeadLaneOpponent  | \n \n integer\n \n   | \n \n   |  
| mostWardsDestroyedOneSweeper  | \n \n integer\n \n   | \n \n   |  
| mythicItemUsed  | \n \n integer\n \n   | \n \n   |  
| playedChampSelectPosition  | \n \n integer\n \n   | \n \n   |  
| soloTurretsLategame  | \n \n integer\n \n   | \n \n   |  
| takedownsFirst25Minutes  | \n \n integer\n \n   | \n \n   |  
| teleportTakedowns  | \n \n integer\n \n   | \n \n   |  
| thirdInhibitorDestroyedTime  | \n \n integer\n \n   | \n \n   |  
| threeWardsOneSweeperCount  | \n \n integer\n \n   | \n \n   |  
| visionScoreAdvantageLaneOpponent  | \n \n float\n \n   | \n \n   |  
| InfernalScalePickup  | \n \n integer\n \n   | \n \n   |  
| fistBumpParticipation  | \n \n integer\n \n   | \n \n   |  
| voidMonsterKill  | \n \n integer\n \n   | \n \n   |  
| abilityUses  | \n \n integer\n \n   | \n \n   |  
| acesBefore15Minutes  | \n \n integer\n \n   | \n \n   |  
| alliedJungleMonsterKills  | \n \n float\n \n   | \n \n   |  
| baronTakedowns  | \n \n integer\n \n   | \n \n   |  
| blastConeOppositeOpponentCount  | \n \n integer\n \n   | \n \n   |  
| bountyGold  | \n \n integer\n \n   | \n \n   |  
| buffsStolen  | \n \n integer\n \n   | \n \n   |  
| completeSupportQuestInTime  | \n \n integer\n \n   | \n \n   |  
| controlWardsPlaced  | \n \n integer\n \n   | \n \n   |  
| damagePerMinute  | \n \n float\n \n   | \n \n   |  
| damageTakenOnTeamPercentage  | \n \n float\n \n   | \n \n   |  
| dancedWithRiftHerald  | \n \n integer\n \n   | \n \n   |  
| deathsByEnemyChamps  | \n \n integer\n \n   | \n \n   |  
| dodgeSkillShotsSmallWindow  | \n \n integer\n \n   | \n \n   |  
| doubleAces  | \n \n integer\n \n   | \n \n   |  
| dragonTakedowns  | \n \n integer\n \n   | \n \n   |  
| legendaryItemUsed  | \n \n List[int]\n \n   | \n \n   |  
| effectiveHealAndShielding  | \n \n float\n \n   | \n \n   |  
| elderDragonKillsWithOpposingSoul  | \n \n integer\n \n   | \n \n   |  
| elderDragonMultikills  | \n \n integer\n \n   | \n \n   |  
| enemyChampionImmobilizations  | \n \n integer\n \n   | \n \n   |  
| enemyJungleMonsterKills  | \n \n float\n \n   | \n \n   |  
| epicMonsterKillsNearEnemyJungler  | \n \n integer\n \n   | \n \n   |  
| epicMonsterKillsWithin30SecondsOfSpawn  | \n \n integer\n \n   | \n \n   |  
| epicMonsterSteals  | \n \n integer\n \n   | \n \n   |  
| epicMonsterStolenWithoutSmite  | \n \n integer\n \n   | \n \n   |  
| firstTurretKilled  | \n \n integer\n \n   | \n \n   |  
| firstTurretKilledTime  | \n \n float\n \n   | \n \n   |  
| flawlessAces  | \n \n integer\n \n   | \n \n   |  
| fullTeamTakedown  | \n \n integer\n \n   | \n \n   |  
| gameLength  | \n \n float\n \n   | \n \n   |  
| getTakedownsInAllLanesEarlyJungleAsLaner  | \n \n integer\n \n   | \n \n   |  
| goldPerMinute  | \n \n float\n \n   | \n \n   |  
| hadOpenNexus  | \n \n integer\n \n   | \n \n   |  
| immobilizeAndKillWithAlly  | \n \n integer\n \n   | \n \n   |  
| initialBuffCount  | \n \n integer\n \n   | \n \n   |  
| initialCrabCount  | \n \n integer\n \n   | \n \n   |  
| jungleCsBefore10Minutes  | \n \n float\n \n   | \n \n   |  
| junglerTakedownsNearDamagedEpicMonster  | \n \n integer\n \n   | \n \n   |  
| kda  | \n \n float\n \n   | \n \n   |  
| killAfterHiddenWithAlly  | \n \n integer\n \n   | \n \n   |  
| killedChampTookFullTeamDamageSurvived  | \n \n integer\n \n   | \n \n   |  
| killingSprees  | \n \n integer\n \n   | \n \n   |  
| killParticipation  | \n \n float\n \n   | \n \n   |  
| killsNearEnemyTurret  | \n \n integer\n \n   | \n \n   |  
| killsOnOtherLanesEarlyJungleAsLaner  | \n \n integer\n \n   | \n \n   |  
| killsOnRecentlyHealedByAramPack  | \n \n integer\n \n   | \n \n   |  
| killsUnderOwnTurret  | \n \n integer\n \n   | \n \n   |  
| killsWithHelpFromEpicMonster  | \n \n integer\n \n   | \n \n   |  
| knockEnemyIntoTeamAndKill  | \n \n integer\n \n   | \n \n   |  
| kTurretsDestroyedBeforePlatesFall  | \n \n integer\n \n   | \n \n   |  
| landSkillShotsEarlyGame  | \n \n integer\n \n   | \n \n   |  
| laneMinionsFirst10Minutes  | \n \n integer\n \n   | \n \n   |  
| lostAnInhibitor  | \n \n integer\n \n   | \n \n   |  
| maxKillDeficit  | \n \n integer\n \n   | \n \n   |  
| mejaisFullStackInTime  | \n \n integer\n \n   | \n \n   |  
| moreEnemyJungleThanOpponent  | \n \n float\n \n   | \n \n   |  
| multiKillOneSpell  | \n \n integer\n \n   | This is an offshoot of the OneStone challenge. The code checks if a spell with the same instance ID does the final point of damage to at least 2 Champions. It doesn't matter if they're enemies, but you cannot hurt your friends.\n \n   |  
| multikills  | \n \n integer\n \n   | \n \n   |  
| multikillsAfterAggressiveFlash  | \n \n integer\n \n   | \n \n   |  
| multiTurretRiftHeraldCount  | \n \n integer\n \n   | \n \n   |  
| outerTurretExecutesBefore10Minutes  | \n \n integer\n \n   | \n \n   |  
| outnumberedKills  | \n \n integer\n \n   | \n \n   |  
| outnumberedNexusKill  | \n \n integer\n \n   | \n \n   |  
| perfectDragonSoulsTaken  | \n \n integer\n \n   | \n \n   |  
| perfectGame  | \n \n integer\n \n   | \n \n   |  
| pickKillWithAlly  | \n \n integer\n \n   | \n \n   |  
| poroExplosions  | \n \n integer\n \n   | \n \n   |  
| quickCleanse  | \n \n integer\n \n   | \n \n   |  
| quickFirstTurret  | \n \n integer\n \n   | \n \n   |  
| quickSoloKills  | \n \n integer\n \n   | \n \n   |  
| riftHeraldTakedowns  | \n \n integer\n \n   | \n \n   |  
| saveAllyFromDeath  | \n \n integer\n \n   | \n \n   |  
| scuttleCrabKills  | \n \n integer\n \n   | \n \n   |  
| shortestTimeToAceFromFirstTakedown  | \n \n float\n \n   | \n \n   |  
| skillshotsDodged  | \n \n integer\n \n   | \n \n   |  
| skillshotsHit  | \n \n integer\n \n   | \n \n   |  
| snowballsHit  | \n \n integer\n \n   | \n \n   |  
| soloBaronKills  | \n \n integer\n \n   | \n \n   |  
| SWARM_DefeatAatrox  | \n \n integer\n \n   | \n \n   |  
| SWARM_DefeatBriar  | \n \n integer\n \n   | \n \n   |  
| SWARM_DefeatMiniBosses  | \n \n integer\n \n   | \n \n   |  
| SWARM_EvolveWeapon  | \n \n integer\n \n   | \n \n   |  
| SWARM_Have3Passives  | \n \n integer\n \n   | \n \n   |  
| SWARM_KillEnemy  | \n \n integer\n \n   | \n \n   |  
| SWARM_PickupGold  | \n \n float\n \n   | \n \n   |  
| SWARM_ReachLevel50  | \n \n integer\n \n   | \n \n   |  
| SWARM_Survive15Min  | \n \n integer\n \n   | \n \n   |  
| SWARM_WinWith5EvolvedWeapons  | \n \n integer\n \n   | \n \n   |  
| soloKills  | \n \n integer\n \n   | \n \n   |  
| stealthWardsPlaced  | \n \n integer\n \n   | \n \n   |  
| survivedSingleDigitHpCount  | \n \n integer\n \n   | \n \n   |  
| survivedThreeImmobilizesInFight  | \n \n integer\n \n   | \n \n   |  
| takedownOnFirstTurret  | \n \n integer\n \n   | \n \n   |  
| takedowns  | \n \n integer\n \n   | \n \n   |  
| takedownsAfterGainingLevelAdvantage  | \n \n integer\n \n   | \n \n   |  
| takedownsBeforeJungleMinionSpawn  | \n \n integer\n \n   | \n \n   |  
| takedownsFirstXMinutes  | \n \n integer\n \n   | \n \n   |  
| takedownsInAlcove  | \n \n integer\n \n   | \n \n   |  
| takedownsInEnemyFountain  | \n \n integer\n \n   | \n \n   |  
| teamBaronKills  | \n \n integer\n \n   | \n \n   |  
| teamDamagePercentage  | \n \n float\n \n   | \n \n   |  
| teamElderDragonKills  | \n \n integer\n \n   | \n \n   |  
| teamRiftHeraldKills  | \n \n integer\n \n   | \n \n   |  
| tookLargeDamageSurvived  | \n \n integer\n \n   | \n \n   |  
| turretPlatesTaken  | \n \n integer\n \n   | \n \n   |  
| turretsTakenWithRiftHerald  | \n \n integer\n \n   | Any player who damages a tower that is destroyed within 30 seconds of a Rift Herald charge will receive credit. A player who does not damage the tower will not receive credit.\n \n   |  
| turretTakedowns  | \n \n integer\n \n   | \n \n   |  
| twentyMinionsIn3SecondsCount  | \n \n integer\n \n   | \n \n   |  
| twoWardsOneSweeperCount  | \n \n integer\n \n   | \n \n   |  
| unseenRecalls  | \n \n integer\n \n   | \n \n   |  
| visionScorePerMinute  | \n \n float\n \n   | \n \n   |  
| wardsGuarded  | \n \n integer\n \n   | \n \n   |  
| wardTakedowns  | \n \n integer\n \n   | \n \n   |  
| wardTakedownsBefore20M  | \n \n integer\n \n   | \n \n   |  
\n
\n\n
\n 
##### MissionsDto 
\n \n - Missions DTO\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| playerScore0  | \n \n int\n \n   | \n \n   |  
| playerScore1  | \n \n int\n \n   | \n \n   |  
| playerScore2  | \n \n int\n \n   | \n \n   |  
| playerScore3  | \n \n int\n \n   | \n \n   |  
| playerScore4  | \n \n int\n \n   | \n \n   |  
| playerScore5  | \n \n int\n \n   | \n \n   |  
| playerScore6  | \n \n int\n \n   | \n \n   |  
| playerScore7  | \n \n int\n \n   | \n \n   |  
| playerScore8  | \n \n int\n \n   | \n \n   |  
| playerScore9  | \n \n int\n \n   | \n \n   |  
| playerScore10  | \n \n int\n \n   | \n \n   |  
| playerScore11  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### PerksDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| statPerks  | \n \n PerkStatsDto\n \n   | \n \n   |  
| styles  | \n \n List[PerkStyleDto]\n \n   | \n \n   |  
\n
\n\n
\n 
##### PerkStatsDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| defense  | \n \n int\n \n   | \n \n   |  
| flex  | \n \n int\n \n   | \n \n   |  
| offense  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### PerkStyleDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| description  | \n \n string\n \n   | \n \n   |  
| selections  | \n \n List[PerkStyleSelectionDto]\n \n   | \n \n   |  
| style  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### PerkStyleSelectionDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| perk  | \n \n int\n \n   | \n \n   |  
| var1  | \n \n int\n \n   | \n \n   |  
| var2  | \n \n int\n \n   | \n \n   |  
| var3  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### TeamDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| bans  | \n \n List[BanDto]\n \n   | \n \n   |  
| objectives  | \n \n ObjectivesDto\n \n   | \n \n   |  
| teamId  | \n \n int\n \n   | \n \n   |  
| win  | \n \n boolean\n \n   | \n \n   |  
\n
\n\n
\n 
##### BanDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| championId  | \n \n int\n \n   | \n \n   |  
| pickTurn  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### ObjectivesDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| baron  | \n \n ObjectiveDto\n \n   | \n \n   |  
| champion  | \n \n ObjectiveDto\n \n   | \n \n   |  
| dragon  | \n \n ObjectiveDto\n \n   | \n \n   |  
| horde  | \n \n ObjectiveDto\n \n   | \n \n   |  
| inhibitor  | \n \n ObjectiveDto\n \n   | \n \n   |  
| riftHerald  | \n \n ObjectiveDto\n \n   | \n \n   |  
| tower  | \n \n ObjectiveDto\n \n   | \n \n   |  
\n
\n\n
\n 
##### ObjectiveDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| first  | \n \n boolean\n \n   | \n \n   |  
| kills  | \n \n int\n \n   | \n \n   |  
\n
\n\n\n
* * *
\n\n 
\n\n 
\n 
#### Response Errors
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n  
| HTTP Status Code  | Reason  |  
| --- | --- |  
| 400  | Bad request  |  
| 401  | Unauthorized  |  
| 403  | Forbidden  |  
| 404  | Data not found  |  
| 405  | Method not allowed  |  
| 415  | Unsupported media type  |  
| 429  | Rate limit exceeded  |  
| 500  | Internal server error  |  
| 502  | Bad gateway  |  
| 503  | Service unavailable  |  
| 504  | Gateway timeout  |  
\n\n 
\n\n 
\n\n \n \n \n \n \n\n \n\n \n \n 
\n 
#### Path Parameters
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n matchId\n  required \n   | \n \n \n \n   | \n \n \n String\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n SEA\n \n \n \n \n\n 
\n\n \n\n 
\n 
#### \n Include API key\n (?)\n 
\n\n 
\n Including an API key as a **query** param allows for easy debugging in the browser.\n   
\n Including an API key as a **header** param, avoids accidentally copy/pasting your API key in public.\n 
\n\n 
\n \n  Query Param\n \n 
\n 
\n \n  Header Param\n \n 
\n 
\n \n  Not required\n \n 
\n 
\n 
* * *
\n\n \n 
\n 
You must [login](https://developer.riotgames.com/api-details/\\"/login\\") to execute APIs through this page.
\n \n 
\n \n \n 
\n\n 
\n\n 
\n 
#### Request URL
\n \n 
\n\n 
\n 
#### Request Body
\n \n 
\n\n 
\n 
#### Request Headers
\n \n 
\n\n 
\n 
#### Response Code
\n \n 
\n\n 
\n 
#### Response Headers
\n \n 
\n\n 
\n 
#### Response Body
\n \n 
\n 
\n
\n\n 
\n\n 
      * \n 
\n \n [GET](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getTimeline\\")\n \n \n [/lol/match/v5/matches/{matchId}/timeline](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getTimeline\\")\n \n \n 
        * [Get a match timeline by match id](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getTimeline\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#match-v5/GET_getTimeline\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: TimelineDto 
\n \n 
\n \n\n\n
\n 
##### TimelineDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| metadata  | \n \n MetadataTimeLineDto\n \n   | Match metadata.\n \n   |  
| info  | \n \n InfoTimeLineDto\n \n   | Match info.\n \n   |  
\n
\n\n
\n 
##### MetadataTimeLineDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| dataVersion  | \n \n string\n \n   | Match data version.\n \n   |  
| matchId  | \n \n string\n \n   | Match id.\n \n   |  
| participants  | \n \n List[string]\n \n   | A list of participant PUUIDs.\n \n   |  
\n
\n\n
\n 
##### InfoTimeLineDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| endOfGameResult  | \n \n string\n \n   | Refer to indicate if the game ended in termination.\n \n   |  
| frameInterval  | \n \n long\n \n   | \n \n   |  
| gameId  | \n \n long\n \n   | \n \n   |  
| participants  | \n \n List[ParticipantTimeLineDto]\n \n   | \n \n   |  
| frames  | \n \n List[FramesTimeLineDto]\n \n   | \n \n   |  
\n
\n\n
\n 
##### ParticipantTimeLineDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| participantId  | \n \n int\n \n   | \n \n   |  
| puuid  | \n \n string\n \n   | \n \n   |  
\n
\n\n
\n 
##### FramesTimeLineDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| events  | \n \n List[EventsTimeLineDto]\n \n   | \n \n   |  
| participantFrames  | \n \n ParticipantFramesDto\n \n   | \n \n   |  
| timestamp  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### EventsTimeLineDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| timestamp  | \n \n long\n \n   | \n \n   |  
| realTimestamp  | \n \n long\n \n   | \n \n   |  
| type  | \n \n string\n \n   | \n \n   |  
\n
\n\n
\n 
##### ParticipantFramesDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| 1-9  | \n \n ParticipantFrameDto\n \n   | Key value mapping for each participant\n \n   |  
\n
\n\n
\n 
##### ParticipantFrameDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| championStats  | \n \n ChampionStatsDto\n \n   | \n \n   |  
| currentGold  | \n \n int\n \n   | \n \n   |  
| damageStats  | \n \n DamageStatsDto\n \n   | \n \n   |  
| goldPerSecond  | \n \n int\n \n   | \n \n   |  
| jungleMinionsKilled  | \n \n int\n \n   | \n \n   |  
| level  | \n \n int\n \n   | \n \n   |  
| minionsKilled  | \n \n int\n \n   | \n \n   |  
| participantId  | \n \n int\n \n   | \n \n   |  
| position  | \n \n PositionDto\n \n   | \n \n   |  
| timeEnemySpentControlled  | \n \n int\n \n   | \n \n   |  
| totalGold  | \n \n int\n \n   | \n \n   |  
| xp  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### ChampionStatsDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| abilityHaste  | \n \n int\n \n   | \n \n   |  
| abilityPower  | \n \n int\n \n   | \n \n   |  
| armor  | \n \n int\n \n   | \n \n   |  
| armorPen  | \n \n int\n \n   | \n \n   |  
| armorPenPercent  | \n \n int\n \n   | \n \n   |  
| attackDamage  | \n \n int\n \n   | \n \n   |  
| attackSpeed  | \n \n int\n \n   | \n \n   |  
| bonusArmorPenPercent  | \n \n int\n \n   | \n \n   |  
| bonusMagicPenPercent  | \n \n int\n \n   | \n \n   |  
| ccReduction  | \n \n int\n \n   | \n \n   |  
| cooldownReduction  | \n \n int\n \n   | \n \n   |  
| health  | \n \n int\n \n   | \n \n   |  
| healthMax  | \n \n int\n \n   | \n \n   |  
| healthRegen  | \n \n int\n \n   | \n \n   |  
| lifesteal  | \n \n int\n \n   | \n \n   |  
| magicPen  | \n \n int\n \n   | \n \n   |  
| magicPenPercent  | \n \n int\n \n   | \n \n   |  
| magicResist  | \n \n int\n \n   | \n \n   |  
| movementSpeed  | \n \n int\n \n   | \n \n   |  
| omnivamp  | \n \n int\n \n   | \n \n   |  
| physicalVamp  | \n \n int\n \n   | \n \n   |  
| power  | \n \n int\n \n   | \n \n   |  
| powerMax  | \n \n int\n \n   | \n \n   |  
| powerRegen  | \n \n int\n \n   | \n \n   |  
| spellVamp  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### DamageStatsDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| magicDamageDone  | \n \n int\n \n   | \n \n   |  
| magicDamageDoneToChampions  | \n \n int\n \n   | \n \n   |  
| magicDamageTaken  | \n \n int\n \n   | \n \n   |  
| physicalDamageDone  | \n \n int\n \n   | \n \n   |  
| physicalDamageDoneToChampions  | \n \n int\n \n   | \n \n   |  
| physicalDamageTaken  | \n \n int\n \n   | \n \n   |  
| totalDamageDone  | \n \n int\n \n   | \n \n   |  
| totalDamageDoneToChampions  | \n \n int\n \n   | \n \n   |  
| totalDamageTaken  | \n \n int\n \n   | \n \n   |  
| trueDamageDone  | \n \n int\n \n   | \n \n   |  
| trueDamageDoneToChampions  | \n \n int\n \n   | \n \n   |  
| trueDamageTaken  | \n \n int\n \n   | \n \n   |  
\n
\n\n
\n 
##### PositionDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| x  | \n \n int\n \n   | \n \n   |  
| y  | \n \n int\n \n   | \n \n   |  
\n
\n\n\n
* * *
\n\n 
\n\n 
\n 
#### Response Errors
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n  
| HTTP Status Code  | Reason  |  
| --- | --- |  
| 400  | Bad request  |  
| 401  | Unauthorized  |  
| 403  | Forbidden  |  
| 404  | Data not found  |  
| 405  | Method not allowed  |  
| 415  | Unsupported media type  |  
| 429  | Rate limit exceeded  |  
| 500  | Internal server error  |  
| 502  | Bad gateway  |  
| 503  | Service unavailable  |  
| 504  | Gateway timeout  |  
\n\n 
\n\n 
\n\n \n \n \n \n \n\n \n\n \n \n 
\n 
#### Path Parameters
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n matchId\n  required \n   | \n \n \n \n   | \n \n \n String\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n SEA\n \n \n \n \n\n 
\n\n \n\n 
\n 
#### \n Include API key\n (?)\n 
\n\n 
\n Including an API key as a **query** param allows for easy debugging in the browser.\n   
\n Including an API key as a **header** param, avoids accidentally copy/pasting your API key in public.\n 
\n\n 
\n \n  Query Param\n \n 
\n 
\n \n  Header Param\n \n 
\n 
\n \n  Not required\n \n 
\n 
\n 
* * *
\n\n \n 
\n 
You must [login](https://developer.riotgames.com/api-details/\\"/login\\") to execute APIs through this page.
\n \n 
\n \n \n 
\n\n 
\n\n 
\n 
#### Request URL
\n \n 
\n\n 
\n 
#### Request Body
\n \n 
\n\n 
\n 
#### Request Headers
\n \n 
\n\n 
\n 
#### Response Code
\n \n 
\n\n 
\n 
#### Response Headers
\n \n 
\n\n 
\n 
#### Response Body
\n \n 
\n 
\n
\n\n 
\n\n\n \n 
\n \n 
\n 
\n\n"}
