# Jira (Atlassian Cloud)

The CodeStream Jira Cloud integration requires users to go through the OAuth
process. This requires a developer app in an Atlassian account to enable the
OAuth handshake and grant access to the system.

## Creating Developer App for OAuth

1. Login to your Atlassian cloud account and go to [the developer apps
   site](https://developer.atlassian.com/apps/).

1. Create > OAuth 2.0 Integrations

1. Distribution > Enable sharing; Also, complete the rest of the page

1. Permissions > Add Jira Platform REST API

1. Confiure Jira Platform Rest API
	- Add **View Jira Issue Data**
	- Add **Create and Manage Issues**
	- Verify **View user profiles** has been added

1. Authorization > User persistent refresh token

1. Set callback URL like `https://stg-api.codestream.us/no-auth/provider-token/jira`

1. Add the client ID, secret, etc.. to the CodeStream server config.
    ```
    {
        "integrations": {
        	"jira": {
                "cloud": {
                "appClientId": "*************************",
                "appClientSecret": "**********************************",
                "disabled": false
            }
        }
    }
    ```
