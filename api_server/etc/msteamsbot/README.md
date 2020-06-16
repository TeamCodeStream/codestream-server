# MS Teams app / bot 
The following describes how to setup an MS Teams bot/app along with the logic
surrounding it in the api_server. Unlike most 3rd party api flows, with this
integration, we are not getting an accessToken and querying a 3rd party api, but
rather, we are gathering information from MS Teams teams, storing that in mongo,
then querying it from the lsp agent.


## Create the bot channel registration resource in Azure

To link MS Teams to the CodeStream bots (our API services which run in our AWS
account) you must create _Bot Channels Registration_ resources (one per
environment) in the Azure Portal.

1.  Login to the [Azure Portal](https://portal.azure.com)
1.  Hamburger Menu (upper left) > '+ Create a resource'
1.  Search for the **bot channels registration** resource and create one. 
    <image src="screens/01-find-bot-service.png" width="400">
    <br>
    <image src="screens/02-create-bot-channel-reg.png" width="400">
1.  Submit the **bot channels registration** form and wait for the resource to
    become available.
    <image src="screens/03-bot-channel-reg-form.png" width="400">
    <br>
    1.  **Bot handles** are globally unique. Our standard is `codestreambot-<env>`
    1.  An Azure Subscription - use `R&D`
    1.  A Resource Group - create a dedicated one or use `codestream-core`
    1.  Location - use `East US`
    1.  Pricing Tier - Use `S1`
    1.  Messaging Endpoint - For developer local environments, use
        `https://csaction.codestream.us/no-auth/provider-action/msteams/<your-host>/development`
        which will forward to port 12079 on `<your-host>`. For other
        environments have operations edit and deploy
        **ops_tools/etc/nginx/proxy/codestream-csaction.conf.template**
        accordingly.
    1.  Turn **Application Insights** off
    1.  Submit the form - **Create** button on the bottom - to submit the
        request to Azure. You'll be notified via the Azure Portal dashboard when
        your resource is ready (2-5 minutes).
1.  Hamburger Menu > Azure Active Directory > App Registrations > _select your app_
1.  Select _Certificates & Secrets_ under the _Manage_ section and create a new
    client secret. <image src="screens/04-generate-new-client-secret.png"
    width="400"><br>_**Make sure you save the secret and add it to your API
    server's configuration file.**_
1.  Delete the secret that was automtically created with the resource. Since you
    don't know its value, it is of no use.
1.  Finally, in the branding section, you can add an icon, links, etc...
    <image src="screens/05-complete-branding-data.png" width="400"><br>


## Creating the MS Teams App Packages

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

### Environments & App IDs (aka botIds)

For operations-managed environments (prod, qa, pd, ...) the Application IDs are
read from the Secrets database. Personal and other Application IDs can be saved
here.

| Env | Application (client) ID - aka botId |
| --- | --- |
| prod | 7cf49ab7-8b65-4407-b494-f02b525eef2b (source of truth is the secrets database) |
| pd | 1a08df08-b652-464a-bac3-bfa386dcfa6d (source of truth is the secrets database) | 
| qa | a0b30480-2944-46a6-97ca-192a655cdb62 (source of truth is the secrets database) |
| brian | 7bce9cff-9fd1-4e05-b7b5-5638ec468880 |

### Package Creation Commands
To create an App Package using dev_tools:
```
$ cs_api-msteams_bot_app_pkg_creator -e <env> -b <bot-application-id>
```
Create a manifest file only (does not require dev_tools):
```
$ cd $CS_API_TOP
$ node bin/cs_msteams_bot_manifest_creator.js -e <env> -b <bot-application-id>
```
Create App Packages for all managed environments and optionally distribute them
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

the `hasSharing` flag is enabled for `modules/msteams_auth/msteams_auth.js`. While MS Teams does not follow the same flow as Slack, it does share a lot of the glue that makes it work -- as it follows the notion of it being a `provider`. As user triggers this flow in the IDE by attempting to add an `MS Teams Organization` from the codemark sharing dropdown.

### Installing
Upon installing the CodeStream bot, users in the team/channel for which the bot was installed to will receive a personal greeting message
 about what CodeStream offers. If the first command a user issues the bot in the personal channel is any thing other than `signin` they 
 will get an even more customized/personal message telling them to issue the `signin` command to get started.

### SignIn
A user gets associated with CodeStream by signing into CodeStream via the web by issuing the `signin` command from the personal CodeStream bot chat. This eventually creates a `signinToken` which is tied to the CS `userId`, CS `teamId` and the MS Teams `tenantId`. If a user is on > 1 team, they will be able to able to connect all the teams. 

When a CS team gets associated, we store on `team` an entry in `providerIdentities` in the format of `msteams::<tenantId>` and we store info about that connection in `providerBotInfo` (not to be confused with `providerInfo` which deals with a team's auth/chat provider)

A reference to their CodeSteam userId is also stored in msteams_state, the key/value store for MST data

### Connecting
Once a user has signed in, they can connect the bot to any team channel on any team in any 
of the teams for that tenant. Upon connecting, we store a reference to the MS Teams team in `msteams_team`,
along with the _conversation_ (aka channel) and store that in `msteams_conversations`. Once this happens we update that user's data, giving them a `providerInfo.<teamId>.msteams.multiple.<tenantId>` object. Here, the accessToken doesn't matter, it just needs to be a string. We don't actually need an accessToken, as we will be querying teams/conversations that are gathered from the MS Teams CodeStream bot.

## Bot Commands
These are the commands that you can issue the CodeStream bot for msteams

### secret commands
These are unlisted commands. There's nothing "secret" about that, just that they're more intended for debugging rather than for a normal MS Teams user

```easteregg```
You'll just have to find out

```debug```
Returns some debugging info

```status```
Returns some info about what CS teams are connected to this tenant (we could allow our users to use this)

```uninstall```
Removes the data attached to the CS team, this prohibits users on any teams attached to this tenant from using the MS Teams integration until a `signin` happens again

```disconnectall```
Removes all the channels from this MS Teams team that are mapped in `msteams_conversations` (slightly descructive as it could affect other team members, but it's a way to start "fresh" if a conversation was removed or renamed)


### personal channels
These commands can only be used when communicated 1-on-1 with the CodeStream bot:

```signin (alias: login)```
Returns a link for a user to begin the auth flow

```signup```
Returns a link for a user to signup

```signout (alias: logout)```
Removes the CodeStream `msteams` provider from the user that ran the command. This is the same as using the `Disconnect <Provider>` from the UI.

### public channels
These commands only work in public channels:

```connect```
Adds this channel as a possible target for codemark sharing.

```disconnect```
Removes this channel as a possible target for codemark sharing.

### any channel
These commands work anywhere: 

```help``` shows a help screen

```start (aliased: welcome, init, initialize)```
Shows a message about getting started

every other command just else shows a generic message asking the user if they need help.

### CodeStream IDE
When a user begins creating a codemark, we attempt to `GET` all the conversations that they've
connected via `/msteams_conversations`. We mix in the `teamName` from `msteams_teams`.
When the codemark is created, we `POST` to `/msteams_conversations` a few properties, but most importantly
the `codemarkId` and `conversationId`. From here, we can lookup which conversation this refers to in 
the `msteams_conversations` collection, and call a `continueConversation` method on our MS Teams bot. 
This will create, what Microsoft calls, a _proactive_ message and post the codemark to the selected channel.

