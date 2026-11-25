{"html": "\n 
\n 
  * \n\n \n 
\n\n \n\n \n\n 
## [summoner-v4](https://developer.riotgames.com/api-details/\\"#summoner-v4\\")
\n \n \n 
    * [Collapse Operations](https://developer.riotgames.com/api-details/\\"#\\")
\n 
    * [Expand Operations](https://developer.riotgames.com/api-details/\\"#\\")
\n \n 
\n \n 
    * \n \n \n\n\n 
      * \n 
\n \n [GET](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByPUUID\\")\n \n \n [/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByPUUID\\")\n \n \n 
        * [Get a summoner by PUUID.](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByPUUID\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByPUUID\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: SummonerDTO 
\n \n 
\n \n\n\n
\n 
##### SummonerDTO 
\n \n - represents a summoner\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| profileIconId  | \n \n int\n \n   | ID of the summoner icon associated with the summoner.\n \n   |  
| revisionDate  | \n \n long\n \n   | Date summoner was last modified specified as epoch milliseconds. The following events will update this timestamp: profile icon change, playing the tutorial or advanced tutorial, finishing a game, summoner name change.\n \n   |  
| puuid  | \n \n string\n \n   | Encrypted PUUID. Exact length of 78 characters.\n \n   |  
| summonerLevel  | \n \n long\n \n   | Summoner level associated with the summoner.\n \n   |  
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
| \n encryptedPUUID\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   | Summoner ID  |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n BR1\n \n \n \n EUN1\n \n \n \n EUW1\n \n \n \n JP1\n \n \n \n KR\n \n \n \n LA1\n \n \n \n LA2\n \n \n \n ME1\n \n \n \n NA1\n \n \n \n OC1\n \n \n \n RU\n \n \n \n SG2\n \n \n \n TR1\n \n \n \n TW2\n \n \n \n VN2\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByAccessToken\\")\n \n \n [/lol/summoner/v4/summoners/me](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByAccessToken\\")\n \n \n 
        * [Get a summoner by access token.](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByAccessToken\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#summoner-v4/GET_getByAccessToken\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: SummonerDTO 
\n \n 
\n \n\n\n
\n 
##### SummonerDTO 
\n \n - represents a summoner\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| profileIconId  | \n \n int\n \n   | ID of the summoner icon associated with the summoner.\n \n   |  
| revisionDate  | \n \n long\n \n   | Date summoner was last modified specified as epoch milliseconds. The following events will update this timestamp: profile icon change, playing the tutorial or advanced tutorial, finishing a game, summoner name change.\n \n   |  
| puuid  | \n \n string\n \n   | Encrypted PUUID. Exact length of 78 characters.\n \n   |  
| summonerLevel  | \n \n long\n \n   | Summoner level associated with the summoner.\n \n   |  
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
| \n Authorization\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   | Bearer token  |  
\n
\n\n \n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n BR1\n \n \n \n EUN1\n \n \n \n EUW1\n \n \n \n JP1\n \n \n \n KR\n \n \n \n LA1\n \n \n \n LA2\n \n \n \n ME1\n \n \n \n NA1\n \n \n \n OC1\n \n \n \n RU\n \n \n \n SG2\n \n \n \n TR1\n \n \n \n TW2\n \n \n \n VN2\n \n \n \n \n\n 
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
