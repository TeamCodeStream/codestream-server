# Azure DevOps Integration

## Creating an OAuth App

The DevOps integration requires an app associated with an Azure DevOps
organization. The OAuth app will have an owner.

* Login to Azure DevOps as a member of the organization and go to
  https://app.vsaex.visualstudio.com/me
* `Applications & Services > Create New Application`
* Complete all fields. Make sure the **Authorization Callback URL** is set to
  something similar to this:
  ```
  https://api.codestream.com/no-auth/provider-token/azuredevops
  ```
* Select the following scopes:
  - Identity (read)
  - Work Items (read and write)
* Copy the App ID and Client Secret (_not_ the App Secret) and add them to the
  CodeStream server configuration file in the **integrations** section like so:
  ```
  {
      "integrations": {
          "devops": {
              "cloud": {
                  "appClientId": "******************",
                  "appClientSecret": "******************************** VERY LONG *******************",
                  "disabled": false
              }
          }
      }
  }
  ```
