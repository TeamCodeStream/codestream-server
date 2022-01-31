# Gitlab Integration

## Gitlab Cloud (gitlab.com)

### Gitlab / OAuth

The Gitlab.com integration for CodeStream implements the standard OAuth
procedure which requires a dedicated OAuth application on Gitlib.com with the
appropriate settings.

1. Login to Gitlab.com

1. `Settings > Applications`
    1. Set the **Redirect URL (callback URL)** to for your API's URL (similar to
       `https://api.codestream.us/no-auth/provider-token/gitlab`)

    1. Select the Confidential, Expire AccessTokens and api Scopes checkboxes
       (all three).

    1. Create the application. Take note of the **Application ID** and
       **Secret**.

1. Add the credentials to the CodeStream server's config file in the
   `intergrations` section.
    ```
    {
        "integrations": {
            "gitlab": {
                "cloud": {
                    "appClientId": "***************************",
                    "appClientSecret": "*************************",
                    "disabled": false
                }
            }
        }
    }
    ```
