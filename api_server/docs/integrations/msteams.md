# MS Teams Integration 

As a messaging integration, it provides for features beyond OAuth; notably,
interactive callbacks for login and replies. As such it a bot resource is needed
on Azure, along with the connector which brings the bot into MS Teams. The
CodeStream API serves as the bot, providing an endpoint for interactive
callbacks.

* [Resource & MST Installation](#create-resources--install)
* [Bot Development Notes](#developing)
* [Bot Commands](#bot-commands)

## Create Resources & Install

Each Azure Bot & corresponding registrations is dedicated to a single codestream
environment.

* [Create Azure Bot](#create-azure-bot)
* [Update App Registration](#update-app-registration)
* [Update the Config](#update-the-api-server-config)
* [Create & Install the MST App Pkg](#create--install-the-ms-teams-app-package)

### Create Azure Bot

1. Login to the [Azure portal](https://portal.azure.com) and choose `Create a
   resource`.
1. Search for **Azure Bot** and press `Create`..<br />
   <image src="images/azure-choose-azure-bot.png" width="400" /><br />
1. Complete the form. Follow proper naming conventions: `codestreambot-<env>`.
   Make sure you choose
   [Multi-Tenant](https://docs.microsoft.com/en-us/azure/active-directory/develop/single-and-multi-tenant-apps#who-can-sign-in-to-your-app).<br
   /> <image src="images/azure-create-bot.png" width="400" /><br />
1. Find your bot on the Bot Resources page..<br />
   <image src="images/azure-bot-list.png" width="400" /><br />
1. Select the bot and navigate to its **Bot Profile** blade, completing it like so.<br />
   <image src="images/azure-bot-profile-blade.png" width="400" /><br />
1. Go to the **Configuration** blade and add these properties. Set your
   **Messaging Endpoint** to
   `https://<env>-api.codestream.com/no-auth/provider-action/msteams`<br />
   <image src="images/azure-bot-configuration-blade.png" width="400" /><br />
1. Go to the **Channels** blade and add the **Microsoft Teams** channel.<br />
   <image src="images/azure-bot-channels-blade.png" width="400" /><br />

### Update App Registration

1. Go to the portal home, and select **Azure Active Directory**, then navigate
   to the **App Registrations** blade. When you created your bot (above) it
   also created an App Registration with the same name.<br />
   <image src="images/azure-app-registrations.png" width="400" /><br />
1. Select your bot's App Registration and go to the **Branding & Properties**
   blade and complete the form.<br />
   <image src="images/azure-app-reg-branding-and-props.png" width="400" /><br />
1. Select the **Authentication** blade, add the **Web** platform specifying the
   OAuth redirect URI. The URL should look similar to
   `https://staging-api.codestream.us/no-auth/provider-token/msteams`<br />

   <image src="images/azure-app-reg-authentication-blade-1.png" width="400" /><br />
   <image src="images/azure-app-reg-authentication-blade-2.png" width="400" /><br />
1. Select the **API Permissions** blade and add the necessary scopes. These are
   **Microsoft Graph** permissions. Source of truth for scopes is in
   [msteams_auth.js](../../modules/msteams_auth/msteams_auth.js). At the time of
   this writing, they are:
   ```
    'User.Read.All',
    'Group.ReadWrite.All',
	'offline_access'
    ```
   <image src="images/azure-api-permissions-blade.png" width="400" /><br />

### Update the API Server Config

1. You'll need four values to add to your CodeStream server config file.
    * The **botAppId** & **appClientId** is the **Application (client) ID** on
      the **Overview blade.
    * The secret (same for both) needs to be set on the **Certificates &
      Secrets** blade. The secret that came with the bot is hidden so you'll
      need to create a new one.
   ```
   {
       "integrations": {
           "cloud": {
               "appClientId": "<application-cliend-id-from-Overview-blade>",
               "appClientSecret": "<secret-from-certificates-and-secrets-blade>",
               "botAppId": "<application-cliend-id-from-Overview-blade>",
               "botAppPassword": "<secret-from-certificates-and-secrets-blade>",
           }
       }
   }
   ```


### Create & Install the MS Teams App Package

MST App Packages are zip files containing a manifest and some icons. App
packages are then loaded into your MS Teams account in order to connect it to
your CodeStream bot apps (backend api server).

The App packages can be distributed to _side load_ them into MS Teams. The
production app package is submitted to the Microsoft AppSource (formerly MST App
Marketplace) for review and approval.

To create app packages you'll need the environment you're creating a package for
as well as the _Application (client) ID_ associated with the bot channels
resource you just created. You can see it on the **Overview** blade of your App
registration.

#### Create package

1. To create an App package (zip file) using the default manifest template
   `$CS_API_TOP/etc/msteamsbot/template/manifest.json`:
   ```
   $ cs_api-msteams_bot_app_pkg_creator -e <env> -b <appClientId>
   ```

#### Install Package

1. Now that you have your package (zip file), open & login to MS Teams, then
   open the App Studio.<br />
   <image src="images/teams-open-app-source.png" width="400" /><br />

1. Import your App package (zip file).<br />
   <image src="images/teams-import-app.png" width="400" /><br />

1. Install the app and add it to one of your channels.<br />
   <image src="images/teams-install-1.png" width="400" /><br />
   <image src="images/teams-install-2.png" width="400" /><br />
   <image src="images/teams-install-3.png" width="400" /><br />

1. In the **Chat** window, you should see your newly added bot. Select that and
   **connect** by typing `@yourbotname connect`. Here, you're authenticating for
   the entire team; others should not have to repeat this step.

#### Other Package Commands

1. Create a manifest file only (does not require dev_tools):
   ```
   $ cd .../codestream-server/api_server
   $ node bin/cs_msteams_bot_manifest_creator.js -e <env> -b <bot-application-id>
   ```

1. Create App Packages for all managed environments and optionally distribute them
   to our CDN (you must have access to the secrets database and S3 asset
   distribution tree).
   ```
   $ cs_api-msteams_bot_app_pkg_creator --use-keydb [--distribute]
   ```
   Once distributed, you can fetch the packages (except production) with:
   `https://assets.codestream.com/mstbot/codestream-msteamsbot-<env>-<version>.zip`
   For production, use:
   `https://assets.codestream.com/mstbot/codestream-msteamsbot-<version>.zip`


### Additional Publishing Documentation
https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/publish

https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/overview


## Developing

Use the App Studio app from within the Teams app to test your app's manifest, as
well as serve as a UI for editing it. From here, you can attach the bot, as well
as install it locally for testing

https://aka.ms/InstallTeamsAppStudio

### Dev logic

the `hasSharing` flag is enabled for `modules/msteams_auth/msteams_auth.js`.
While MS Teams does not follow the same flow as Slack, it does share a lot of
the glue that makes it work -- as it follows the notion of it being a
`provider`. As user triggers this flow in the IDE by attempting to add an `MS
Teams Organization` from the codemark sharing dropdown.

### Installing
Upon installing the CodeStream bot, users in the team/channel for which the bot
was installed to will receive a personal greeting message about what CodeStream
offers. If the first command a user issues the bot in the personal channel is
any thing other than `signin` they will get an even more customized/personal
message telling them to issue the `signin` command to get started.

### SignIn
A user gets associated with CodeStream by signing into CodeStream via the web by
issuing the `signin` command from the personal CodeStream bot chat. This
eventually creates a `signinToken` which is tied to the CS `userId`, CS `teamId`
and the MS Teams `tenantId`. If a user is on > 1 team, they will be able to able
to connect all the teams. 

When a CS team gets associated, we store on `team` an entry in
`providerIdentities` in the format of `msteams::<tenantId>` and we store info
about that connection in `providerBotInfo` (not to be confused with
`providerInfo` which deals with a team's auth/chat provider)

A reference to their CodeSteam userId is also stored in msteams_state, the
key/value store for MST data

### Connecting
Once a user has signed in, they can connect the bot to any team channel on any
team in any of the teams for that tenant. Upon connecting, we store a reference
to the MS Teams team in `msteams_team`, along with the _conversation_ (aka
channel) and store that in `msteams_conversations`. Once this happens we update
that user's data, giving them a
`providerInfo.<teamId>.msteams.multiple.<tenantId>` object. Here, the
accessToken doesn't matter, it just needs to be a string. We don't actually need
an accessToken, as we will be querying teams/conversations that are gathered
from the MS Teams CodeStream bot.

## Bot Commands
These are the commands that you can issue the CodeStream bot for msteams

### secret commands
These are unlisted commands. There's nothing "secret" about that, just that
they're more intended for debugging rather than for a normal MS Teams user

```easteregg```
You'll just have to find out

```debug```
Returns some debugging info

```status```
Returns some info about what CS teams are connected to this tenant (we could
allow our users to use this)

```uninstall```
Removes the data attached to the CS team, this prohibits users on any teams
attached to this tenant from using the MS Teams integration until a `signin`
happens again

```disconnectall```
Removes all the channels from this MS Teams team that are
mapped in `msteams_conversations` (slightly descructive as it could affect other
team members, but it's a way to start "fresh" if a conversation was removed or
renamed)


### personal channels
These commands can only be used when communicated 1-on-1 with the CodeStream
bot:

```signin (alias: login)```
Returns a link for a user to begin the auth flow

```signup```
Returns a link for a user to signup

```signout (alias: logout)```
Removes the CodeStream `msteams` provider from the user that ran the command.
This is the same as using the `Disconnect <Provider>` from the UI.

### public channels
These commands only work in public channels:

```connect```
Adds this channel as a possible target for codemark sharing.

```disconnect```
Removes this channel as a possible target for codemark sharing.

### any channel
These commands work anywhere: 

```help```
shows a help screen

```start (aliased: welcome, init, initialize)```
Shows a message about getting started

Every other command just else shows a generic message asking the user if they
need help.

### CodeStream IDE
When a user begins creating a codemark, we attempt to `GET` all the
conversations that they've connected via `/msteams_conversations`. We mix in the
`teamName` from `msteams_teams`. When the codemark is created, we `POST` to
`/msteams_conversations` a few properties, but most importantly the `codemarkId`
and `conversationId`. From here, we can lookup which conversation this refers to
in the `msteams_conversations` collection, and call a `continueConversation`
method on our MS Teams bot. This will create, what Microsoft calls, a
_proactive_ message and post the codemark to the selected channel.
