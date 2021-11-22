# Integration with Github

## Github Cloud (github.com)

### SSO / OAuth

Github.com SSO support for CodeStream implements the standard OAuth procedure
which requires a dedicated OAuth application on Github.com with the appropriate
settings.

1. Login to Github.com

1. `Settings > Developer Settings > OAuth Apps > Create New App`
    1. Set the **Authorization Callback URL** to for your API's URL (similar to
       `https://api.codestream.us/no-auth/provider-token/github`)
    1. Generate a client secret and add both the Client ID and secret to the
       secrets database.

1. Add the credentials to the CodeStream server's config file in the
   `intergrations` section.
    ```
    {
        "integrations": {
            "github": {
                "cloud": {
                    "appClientId": "***************************",
                    "appClientSecret": "*************************",
                    "disabled": false
                }
            }
        }
    }
    ```
