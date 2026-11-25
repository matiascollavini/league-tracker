{"html": "\n 
\n 
  * \n\n \n 
\n\n \n\n \n 
#### There are three routing values for account-v1; americas, asia, and europe. You can query for any account in any region. We recommend using the nearest cluster.
\n \n\n 
## [account-v1](https://developer.riotgames.com/api-details/\\"#account-v1\\")
\n \n \n 
    * [Collapse Operations](https://developer.riotgames.com/api-details/\\"#\\")
\n 
    * [Expand Operations](https://developer.riotgames.com/api-details/\\"#\\")
\n \n 
\n \n 
    * \n \n \n\n\n 
      * \n 
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuid\\")\n \n \n [/riot/account/v1/accounts/by-puuid/{puuid}](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuid\\")\n \n \n 
        * [Get account by puuid](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuid\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuid\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountDto 
\n \n 
\n \n\n\n
\n 
##### AccountDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| puuid  | \n \n string\n \n   | Encrypted PUUID. Exact length of 78 characters.\n \n   |  
| gameName  | \n \n string\n \n   | This field may be excluded from the response if the account doesn't have a gameName.\n \n   |  
| tagLine  | \n \n string\n \n   | This field may be excluded from the response if the account doesn't have a tagLine.\n \n   |  
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
| \n puuid\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuidEsports\\")\n \n \n [/riot/account/v1/accounts/by-puuid/{puuid}](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuidEsports\\")\n \n \n 
        * [Get account by puuid - ESPORTS](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuidEsports\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByPuuidEsports\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountDto 
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
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n puuid\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotId\\")\n \n \n [/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotId\\")\n \n \n 
        * [Get account by riot id](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotId\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotId\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountDto 
\n \n 
\n \n\n\n
\n 
##### AccountDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| puuid  | \n \n string\n \n   | Encrypted PUUID. Exact length of 78 characters.\n \n   |  
| gameName  | \n \n string\n \n   | This field may be excluded from the response if the account doesn't have a gameName.\n \n   |  
| tagLine  | \n \n string\n \n   | This field may be excluded from the response if the account doesn't have a tagLine.\n \n   |  
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
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n tagLine\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   | When querying for a player by their riot id, the gameName and tagLine query params are required.  |  
| \n gameName\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   | When querying for a player by their riot id, the gameName and tagLine query params are required.  |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotIdEsports\\")\n \n \n [/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotIdEsports\\")\n \n \n 
        * [Get account by riot id - ESPORTS](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotIdEsports\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByRiotIdEsports\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountDto 
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
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n gameName\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   | When querying for a player by their riot id, the gameName and tagLine query params are required.  |  
| \n tagLine\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   | When querying for a player by their riot id, the gameName and tagLine query params are required.  |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessToken\\")\n \n \n [/riot/account/v1/accounts/me](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessToken\\")\n \n \n 
        * [Get account by access token](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessToken\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessToken\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountDto 
\n \n 
\n \n\n\n
\n 
##### AccountDto 
\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| puuid  | \n \n string\n \n   | Encrypted PUUID. Exact length of 78 characters.\n \n   |  
| gameName  | \n \n string\n \n   | This field may be excluded from the response if the account doesn't have a gameName.\n \n   |  
| tagLine  | \n \n string\n \n   | This field may be excluded from the response if the account doesn't have a tagLine.\n \n   |  
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
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessTokenEsports\\")\n \n \n [/riot/account/v1/accounts/me](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessTokenEsports\\")\n \n \n 
        * [Get account by access token - ESPORTS](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessTokenEsports\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getByAccessTokenEsports\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountDto 
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
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveShard\\")\n \n \n [/riot/account/v1/active-shards/by-game/{game}/by-puuid/{puuid}](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveShard\\")\n \n \n 
        * [Get active shard for a player](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveShard\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveShard\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: ActiveShardDto 
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
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n game\n  required \n   | \n \n \n\n \n \n \n\n \n \n val\n \n \n \n lor\n \n \n \n 2xko\n \n \n\n \n \n   | \n \n \n string\n \n \n   |   |  
| \n puuid\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
\n \n [GET](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveRegion\\")\n \n \n [/riot/account/v1/region/by-game/{game}/by-puuid/{puuid}](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveRegion\\")\n \n \n 
        * [Get active region (lol and tft)](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveRegion\\")
\n \n 
\n \n
\n \n\n \n\n 
[Jump to Inputs](https://developer.riotgames.com/api-details/\\"#account-v1/GET_getActiveRegion\\")
\n\n \n\n \n\n \n\n 
\n 
#### Response Classes
\n 
\n \n 
#### Return value: AccountRegionDTO 
\n \n 
\n \n\n\n
\n 
##### AccountRegionDTO 
\n \n - Account region\n \n   
\n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n \n   
| Name  | Data Type  | Description  |  
| --- | --- | --- |  
| puuid  | \n \n string\n \n   | Player Universal Unique Identifier. Exact length of 78 characters. (Encrypted)\n \n   |  
| game  | \n \n string\n \n   | Game to lookup active region\n \n   |  
| region  | \n \n string\n \n   | Player active region\n \n   |  
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
\n\n \n \n \n \n \n \n \n \n \n\n \n \n \n \n \n\n \n\n \n \n \n \n \n \n \n \n\n \n\n \n \n \n \n \n \n   
| Name  | Value  | Data Type  | Description  |  
| --- | --- | --- | --- |  
| \n puuid\n  required \n   | \n \n \n \n   | \n \n \n string\n \n \n   |   |  
| \n game\n  required \n   | \n \n \n\n \n \n \n\n \n \n lol\n \n \n \n tft\n \n \n\n \n \n   | \n \n \n string\n \n \n   |   |  
\n
\n\n \n\n \n\n \n\n \n\n \n 
#### Select Region to Execute Against
\n \n \n \n AMERICAS\n \n \n \n ASIA\n \n \n \n EUROPE\n \n \n \n \n\n 
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
