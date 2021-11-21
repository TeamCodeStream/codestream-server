# Integration with Trello

The API requires a developer key from Trello which is matched to the redirect
URL's used in the OAuth process. It is not used for the CodeStream extension's
issues features.

The Trello developer key is associated with a trello account. First, login to
Trello and then go to https://trello.com/app-key/. Here you can see the key and
the few properties associated with it.

1. Add the key to the CodeStream configuration file in the `integrations`
   section.
    ```
    {
        "integrations": {
            "trello": {
                "cloud": {
                    "apiKey": "***************************",
                    "disabled": false
                }
            }
        }
    }
    ```

1. Make sure your API server's URL is added to the **Allowed Origins** section.
   For example, `https://api.codestream.com/`.
