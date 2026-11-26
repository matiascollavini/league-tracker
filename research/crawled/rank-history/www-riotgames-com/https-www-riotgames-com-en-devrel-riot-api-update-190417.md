[Jump to Main Content](https://www.riotgames.com/en/DevRel/riot-api-update-190417#content)[Jump to Primary Navigation](https://www.riotgames.com/en/DevRel/riot-api-update-190417#riotbar-bar)
[ mainLogoRiotFist21mainLogoRiotFistIcon21 mainMenuDownNonHover](https://www.riotgames.com/en)
[](https://www.riotgames.com/en)
[Who We Are](https://www.riotgames.com/en/who-we-are)
[Work with us](https://www.riotgames.com/en/work-with-us)
[News](https://www.riotgames.com/en/news)
[](https://www.riotgames.com/en)
globeIcon
burgerNav
burgerNavClose
[Who We Are](https://www.riotgames.com/en/who-we-are)[Work with us](https://www.riotgames.com/en/work-with-us)[News](https://www.riotgames.com/en/news)
SIGN IN
SIGN IN
News
# Positional Ranking Deprecation
  * By [**David "Tuxedo" Chow**](https://www.riotgames.com/en/DevRel/riot-api-update-190417#author)
  * **Apr 18, 2019**


  * [Share this on Reddit](https://reddit.com/submit?url=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417)
  * [Share this on Twitter](https://twitter.com/share?url=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417&text=Positional%20Ranking%20Deprecation)
  * [Share this on Facebook](https://www.facebook.com/sharer/sharer.php?&u=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417)
  * Toggle additional sharing options
    * [Share this on LinkedIn](https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417)
    * Share this via Email
    * [Share this on Reddit](https://reddit.com/submit?url=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417)
    * [Share this on Twitter](https://twitter.com/share?url=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417&text=Positional%20Ranking%20Deprecation)
    * [Share this on Facebook](https://www.facebook.com/sharer/sharer.php?&u=https%3A%2F%2Fwww.riotgames.com%2Fen%2FDevRel%2Friot-api-update-190417)


![](https://www.riotgames.com/darkroom/1440/07713ae36ef80d6194d0214fa27a33b1:d282e2bd4eb8da3ec6668878741ccee3/positional-ranking.png)
**TL;DR We're making some changes to the league-v4 API. We're deprecating three methods, adding two methods, and making some small quality of life improvements.​**  
  
Back in March, Riot SapMagic [announced](https://nexus.leagueoflegends.com/en-us/2019/03/dev-state-of-ranked/) that we'll be rolling back the positional ranking changes to leagues. As a result, we'll be making some changes to the league-v4 API to better reflect the resulting state of the leagues service.
  1. As of today, three methods related to positional ranking have been deprecated and will be removed in 60 days on Monday, June 17th per our [deprecation policy](https://developer.riotgames.com/api-versioning.html).  
  
/lol/league/v4/positional-rank-queues  
/lol/league/v4/positions/by-summoner/{encryptedSummonerId}  
/lol/league/v4/positions/{positionalQueue}/{tier}/{division}/{position}/{page}
  2. We're adding two new methods that should be used going forward.  
  
/lol/league/v4/entries/by-summoner/{encryptedSummonerId}  
/lol/league/v4/entries/{queue}/{tier}/{division}
  3. We're making some small quality of life improvements.


## Deprecated Methods
All three deprecated methods will stick around and behave normally until June 17th despite the fact that two of these methods currently don't return any data. We've included a header for these deprecated methods, **X-Riot-Deprecated** , which will return a unix timestamp for the date you should expect this method to no longer exist.
## LeagueEntryDTO Response Object
The two new methods have a different response object than the previous methods; **LeagueEntryDTO**. LeagueEntryDTO is almost exactly the same as its predecessor LeaguePositionDTO except for the following:
  1. The **leagueName** field, which is no longer shown in the client, is not included in the response.
  2. The **position** field, a remnant of positional ranking, is not included in the response.


~~_Note:**leagueId** is not included in the response for the GET_getLeagueEntries_  _method used to paginate through the ranked ladder, however we're looking into including this field._~~  
_UPDATE: As of May 29th, the**leagueId** is included in the response for the GET_getLeagueEntries method._
## getLeagueEntries Method
/lol/league/v4/entries/{queue}/{tier}/{division}  
  
We've changed how pagination works in the new getLeaguesEntries method. The page is now an optional query parameter that defaults to the first page if no value is specified. Unlike this method's predecessor, getPositionalLeagueEntries, the first page has been changed to 1, so by default page is set to 1 and not 0.
## Questions? Issues?
As always, if there are any questions feel free to reach out during office hours which we hold every other Friday on our [Discord](https://discord.gg/riotapi). If you run into any issues, don't hesitate to open an issue on [GitHub](https://github.com/RiotGames/developer-relations/issues). I'll be keeping an eye out and responding as quickly as possible to issues related to these changes.
AYAYA on,  
Riot Tuxedo
![](https://www.riotgames.com/darkroom/300/889d66d64988cfc427d21f150269066f:4541998dcd49f71963ac2f3a41d99669/685.png)
Author
![](https://www.riotgames.com/darkroom/300/889d66d64988cfc427d21f150269066f:4541998dcd49f71963ac2f3a41d99669/685.png)
### David "Tuxedo" Chow
Senior Developer Relations @ Riot Games  
Don't </believing>
[Read More](https://twitter.com/RiotTuxedo)
## Related Posts
[Escape Room Recap](https://www.riotgames.com/en/DevRel/af-recap)
![](https://www.riotgames.com/darkroom/600/57c9a27193a6c559ef1a6ad67d7663f4:727b62f5e0ec4a5d6eb5986607bcd9f6/c-o-champion-blitzcrank-definitelynotblitzcrank-splash.jpg)
Riot GamesNews
Apr 9, 2019
### Escape Room Recap
For the second year in a row, the teams that bring you the Riot Games API have delivered a little bit of fun for April Fools day. This year we put together an experience for the developers in the Riot Games ecosystem.
Apr 9, 2019
[It’s April Fool's and You’re No Fool...](https://www.riotgames.com/en/DevRel/escape-af)
![](https://www.riotgames.com/darkroom/600/0d486b68c2676f2a1a192000c3234ca5:6b92cc24aabfceb2c5358ee75556ed65/runeterra-shadowisles-08.jpg)
Riot GamesNews
Mar 28, 2019
### It’s April Fool's and You’re No Fool...
Every product team has to manage deadlines and priorities when building out their roadmaps. It’s easy to lose track of what’s important; the community. That’s why on April Fool's we want to take the time to create an experience just for developers, minus the trickery. 
Mar 28, 2019
[Launching New Products Effectively](https://www.riotgames.com/en/DevRel/product-launch)
![](https://www.riotgames.com/darkroom/600/97ae92274b9e9a9356640ad9241b2acd:8a51acb7e84cc64d2dea0272028c9255/c-o-runeterra-piltover-32.jpg)
Riot GamesNews
Mar 25, 2019
### Launching New Products Effectively
Launching a new product is one of the most exciting, yet scary, things you can do. You pour your heart into developing something and you want it to succeed. I’ve been on both some very good launches and some disastrous ones, and through both I have learned many lessons. Here are just a few.
Mar 25, 2019
[Getting Better, One Convention At A Time](https://www.riotgames.com/en/DevRel/gaming-conferences)
![](https://www.riotgames.com/darkroom/600/a3d9f4b41567d45f82f94c99020319d4:7494a9767c7d3afb2752c4e5323bf535/people-crowd-audience-orchestra-wcphx-convention-225190-pxhere-com.jpg)
Riot GamesNews
Mar 8, 2019
### Getting Better, One Convention At A Time
To continue to grow as a company and individual it is important to take advantage of events that can help grow your business, career, and more. 
Mar 8, 2019
[Riot Games](https://www.riotgames.com/)
  * [](https://www.riotgames.com/who-we-are)
  * [](https://www.riotgames.com/work-with-us)
  * [](https://www.riotgames.com/news)


  * [Press](https://www.riotgames.com/en/press)
  * [Security](https://www.riotgames.com/en/security)
  * [Legal](https://www.riotgames.com/en/legal)
  * [Leadership](https://www.riotgames.com/en/leadership)
  * [Candidate Privacy](https://www.riotgames.com/en/candidate-privacy)
  * [Terms of Service](https://www.riotgames.com/en/terms-of-service)
  * [Privacy Notice](https://www.riotgames.com/en/privacy-notice)
  * [Player Support](https://support.riotgames.com/hc/en-us)
  * [E-Verify](https://www.riotgames.com/en/e-verify-right-to-work)
  * [Accessibility](https://www.riotgames.com/en/accessibility)
  * [Annual Reports](https://www.riotgames.com/en/annual-reports)
  * [Peering Information](https://www.riotgames.com/en/peering-information)
  * [Community Pact](https://www.riotgames.com/en/community-pact)


[Follow us on Twitter](https://twitter.com/riotgames)[Follow us on Instagram](https://www.instagram.com/riotgames/)[Follow us on Tiktok](https://www.tiktok.com/@riotgames)[Share this on LinkedIn](https://www.linkedin.com/company/riot-games)[Follow us on Facebook](https://www.facebook.com/RiotGames/)[Watch on YouTube](https://www.youtube.com/riotgames)
Cookie Preferences
© 2026 Riot Games, Inc. All Rights Reserved.
[To the Surface](https://www.riotgames.com/en/DevRel/riot-api-update-190417#top)
