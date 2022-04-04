# Linear Integration

## Setting up an OAuth App

* Login to (register with) [Linear](https://linear.app).
* From the user profile dropdown, select `Settings > API`
* Here is where you can Create a new OAuth Application. Make sure you add a
  Redirect URL for _your_ api _similar_ to this:
  ```
  https://my-api.codestream.com/no-auth/provider-token/linear
  ```
* Copy the client ID & Secret and add them to the CodeStream server config
  in the **integrations** section like this:
    ```
    {
        "integrations": {
        	"linear": {
                "cloud": {
                "appClientId": "*************************",
                "appClientSecret": "**********************************",
                "disabled": false
            }
        }
    }
    ```
