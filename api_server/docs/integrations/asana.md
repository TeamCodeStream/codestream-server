# Asana Integration

## Setting up an OAuth App

* You will need an Asana account (obviously) and be logged into it.
* Go to the [Manage Developer Apps](https://app.asana.com/0/my-apps) page. If
  that link doesn't work directly, the [asana OAuth
  documentation](https://developers.asana.com/docs/oauth) includes this link to
  [register an application](https://app.asana.com/-/account_api). On that page,
  you should find a link to **Manage Developer Apps**.
* Create a new app and fill in the basic information
* On the left nav bar, select Configure > OAuth
* Add a redirect URL for your API installation. Similar to this:
  ```
  https://api.codestream.com/no-auth/provider-token/asana
  ```
* Copy the **Client ID** and **Client Secret** from that page and add them as a
  sub-section of the **integrations** section in your CodeStream configuration
  file, like this:
  ```
  {
      "integrations": {
          "asana": {
              "cloud": {
                  "appClientId": "******************",
                  "appClientSecret": "********************************",
                  "disabled": false
              }
          }
      }
  }
  ```

## References

* https://developers.asana.com/docs/authentication-basics
* https://app.asana.com/0/developer-console
