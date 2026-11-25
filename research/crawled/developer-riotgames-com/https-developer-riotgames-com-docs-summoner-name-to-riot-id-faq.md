Opens in a new window Opens an external website Opens an external website in a new window
This website utilizes technologies such as cookies to enable essential site functionality, as well as for analytics, personalization, and targeted advertising. To learn more, view the following link:  [Privacy Notice](https://www.riotgames.com/en/privacy-notice)
Manage Preferences 
Close this consent banner
Storage Preferences 
[![](https://static.developer.riotgames.com/img/logo.png)](https://developer.riotgames.com/)
  * [APIs](https://developer.riotgames.com/apis)
  * Docs
[Developer Portal](https://developer.riotgames.com/docs/portal) [League of Legends](https://developer.riotgames.com/docs/lol) [Legends of Runeterra](https://developer.riotgames.com/docs/lor) [Teamfight Tactics](https://developer.riotgames.com/docs/tft) [Valorant](https://developer.riotgames.com/docs/valorant) [Riftbound](https://developer.riotgames.com/docs/riftbound) [2KXO](https://developer.riotgames.com/docs/2xko)
  * Policies
[General](https://developer.riotgames.com/policies/general) [Game Specific](https://developer.riotgames.com/policies/game-specific) [Riftbound](https://developer.riotgames.com/policies/riftbound)
  * [Faqs](https://developer.riotgames.com/docs/faqs)
  * Channels
[Blog](https://www.riotgames.com/en/DevRel) [Twitter](https://twitter.com/RiotGamesDevRel) [Discord](https://discord.gg/riotgamesdevrel) [Issue Tracker](https://github.com/RiotGames/developer-relations/issues)
  * [Support](https://support-developer.riotgames.com)


  * [Login](https://developer.riotgames.com/login)


[FAQ](https://developer.riotgames.com/docs/summoner-name-to-riot-id-faq#_faq)
[ ](https://twitter.com/RiotGamesDevRel) [ ](https://discord.gg/riotgamesdevrel) [ ](https://github.com/RiotGames/developer-relations/issues)
[Terms](https://developer.riotgames.com/terms) · [Privacy](https://www.riotgames.com/en/privacy-notice)
© 2021 Riot Games, Inc. All rights reserved. League of Legends and Riot Games are trademarks, service marks, and registered trademarks of Riot Games, Inc.
Summoner Name to Riot ID
### LAST UPDATED: October 30, 2023
## FAQ
### Is there an endpoint to get Summoner Name by Riot ID or Riot ID by Summoner Name?
Unfortunately, no. We currently have no plans to add riotIdName or riotIdTagline on League endpoints.
We recommend having your own database of players (summonerID + puuid). This lookup creates new players on your end.
### What are the rules for allowing special characters in RiotIDs (Game Name + Tagline)?
Game names are 3-16 characters long. Do not use the `#` symbol. This is the separator between Game Name and Tagline.
Tagline is 3-5 alphanumeric characters. Any Unicode **letter** is supported in both fields.
### When will summonerName fields be removed from raw-matches?
There is no ETA on removing Summoner Names. However, the SummonerName field will be stale, containing old data, as of November 20, 2023. After that date, RiotID will be the preferred player identification.
We encourage you to change from Summoner Names to RiotID as soon as possible.
### Will League API keys get a rate limit increase to compensate for additional calls?
This will be reviewed on a case-by-case basis. If you find you are hitting your rate limit, please reach out to us via the developer portal at <https://developer.riotgames.com>.
### Will each player still be tied to a specific region ID, even though we no longer look up by Summoner Name + Region ID?
Yes, all player data will continue to be sharded to the League / TFT region.
### What is the best way to look up the League Region ID associated with a Riot ID?
We are working to add League and TFT to the active-shards endpoint. Unfortunately, we do not have an ETA for completion. We recommend changing your forms from Region + Summoner Name to Region + Riot ID until we finish this feature.
After we release the League/TFT parameters, you will be able to take only the RiotID as input from players.
For general questions regarding the Summoner Name to Riot ID transition, please check out the [Support Team FAQ](https://support-leagueoflegends.riotgames.com/hc/en-us/articles/20616577122707-Summoner-Name-to-Riot-ID-Transition-FAQ).
[ ](https://twitter.com/RiotGamesDevRel) [ ](https://discord.gg/riotgamesdevrel) [ ](https://github.com/RiotGames/developer-relations/issues)
[Terms](https://developer.riotgames.com/terms) · [Privacy](https://www.riotgames.com/en/privacy-notice)
© 2021 Riot Games, Inc. All rights reserved. League of Legends and Riot Games are trademarks, service marks, and registered trademarks of Riot Games, Inc.
