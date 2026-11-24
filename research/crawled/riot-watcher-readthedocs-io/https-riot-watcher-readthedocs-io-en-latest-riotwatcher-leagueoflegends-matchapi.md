# MatchApiV5[¶](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/MatchApiV5.html#matchapiv5 "Permalink to this headline") 

_class_`riotwatcher._apis.league_of_legends.``MatchApiV5`(_base_api: riotwatcher._apis.BaseApi.BaseApi_)[¶](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/MatchApiV5.html#riotwatcher._apis.league_of_legends.MatchApiV5 "Permalink to this definition") 
    
This class wraps the Match-v5 endpoint calls provided by the Riot API.
See <https://developer.riotgames.com/api-methods/#match-v5> for more detailed information
Initialize a new MatchApiV5 which uses the provided base_api  
| Parameters:  |  **base_api** (_BaseApi_) – the root API object to use for making all requests.  |  
| --- | --- | 

`by_id`(_region: str_ , _match_id: str_)[¶](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/MatchApiV5.html#riotwatcher._apis.league_of_legends.MatchApiV5.by_id "Permalink to this definition") 
      
Get match by match ID  
| Parameters:  | 
  * **region** (_string_) – The region to execute this request on
  * **match_id** (_string_) – The match ID.

 |  
| --- | --- |  
| Returns:  |  MatchDto  | 

`matchlist_by_puuid`(_region: str_ , _puuid: str_ , _start: int = None_ , _count: int = None_ , _queue: int = None_ , _type: str = None_ , _start_time: int = None_ , _end_time: int = None_)[¶](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/MatchApiV5.html#riotwatcher._apis.league_of_legends.MatchApiV5.matchlist_by_puuid "Permalink to this definition") 
      
Get matchlist for ranked games played on given account ID and platform ID and filtered using given filter parameters, if any  
| Parameters:  | 
  * **region** (_string_) – The region to execute this request on
  * **puuid** (_string_) – The puuid.
  * **start** (_int_) – Defaults to 0. Start index.
  * **count** (_int_) – Defaults to 20. Valid values: 0 to 100. Number of match ids to return.
  * **queue** (_int_) – Filter the list of match ids by a specific queue id. This filter is mutually inclusive of the type filter meaning any match ids returned must match both the queue and type filters.
  * **type** (_string_) – Filter the list of match ids by the type of match. This filter is mutually inclusive of the queue filter meaning any match ids returned must match both the queue and type filters.
  * **start_time** (_long_) – Epoch timestamp in seconds. The matchlist started storing timestamps on June 16th, 2021. Any matches played before June 16th, 2021 won’t be included in the results if the startTime filter is set.
  * **end_time** (_long_) – Epoch timestamp in seconds.

 |  
| --- | --- |  
| Returns:  |  List[string]  | 

`timeline_by_match`(_region: str_ , _match_id: str_)[¶](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/MatchApiV5.html#riotwatcher._apis.league_of_legends.MatchApiV5.timeline_by_match "Permalink to this definition") 
      
Get match timeline by match ID.
Not all matches have timeline data.  
| Parameters:  | 
  * **region** (_string_) – The region to execute this request on
  * **match_id** (_string_) – The match ID.

 |  
| --- | --- |  
| Returns:  |  MatchTimelineDto  |  
# [RiotWatcher](https://riot-watcher.readthedocs.io/en/latest/index.html)
### Navigation
  * [League of Legends Watcher](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/index.html)
  * [Legends Of Runeterra Watcher](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LegendsOfRuneterra/index.html)
  * [Riot Watcher](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/Riot/index.html)
  * [Team Fight Tactics Watcher](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/TeamFightTactics/index.html)
  * [Valorant Watcher](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/Valorant/index.html)
  * [Handlers](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/Handlers/index.html)
  * [Testing](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/testing.html)


### Related Topics
  * [Documentation overview](https://riot-watcher.readthedocs.io/en/latest/index.html)
    * [<no title>](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/index.html)
      * [League of Legends Watcher](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/index.html)
        * Previous: [LolStatusApiV4](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/LolStatusApiV4.html "previous chapter")
        * Next: [ChallengesApiV1](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/LeagueOfLegends/ChallengesApiV1.html "next chapter")


### Quick search
©2020, pseudonym117. | Powered by [Sphinx 1.8.6](http://sphinx-doc.org/) & [Alabaster 0.7.13](https://github.com/bitprophet/alabaster) | [Page source](https://riot-watcher.readthedocs.io/en/latest/_sources/riotwatcher/LeagueOfLegends/MatchApiV5.rst.txt)
