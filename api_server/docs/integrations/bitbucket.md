# Bitbucket Ingtegration

## Setting up an OAuth Consumer

* You will need a Bitbucket (Atlassian) account (obviously) and be logged into it.
* On the Profile drop down, select the workspace you want to own the OAuth
  consumer app or select "All Workspaces" if you want to create a new workspace.
  On the "All Workspaces" page you can create a new one if you want.
* Once you've selected your workspace, select `Settings > OAuth Consumers > Add Consumer`
* Complete the fields, of note is the callback URL which should look something like this:
  ```
  https://api.codestream.com/no-auth/provider-token/bitbucket
  ```
* For scopes, select the following:
  - Account: email, read
  - Issues: read, write
  - Workspace Membership: read
  - Projects: read
  - Repositories: read, write
  - Pull Requests: read, write
  - Snippets: read
* A key and secret will be generated for the consumer app. These values should
  be added to your CodeStream server configuration file in the **integrations**
  section with `appClientId` holding the **Key** and the `appClientSecret`
  holding the **Secret**.
  ```
  {
      "integrations": {
          "bitbucket": {
              "cloud": {
                  "appClientId": "******************",
                  "appClientSecret": "********************************",
                  "disabled": false
              }
          }
      }
  }
  ```

## Reference Links

* https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/
