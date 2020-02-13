# MS Teams app / bot 
The following describes how to setup an MS Teams bot/app along with 
the logic surrounding it in the api_server. Unlike most 3rd party api flows, with this integration, we are not getting an accessToken and querying a 3rd party api, but rather, we are gathering information from MS Teams teams, storing that in mongo, then querying it from the lsp agent.

## App/Bot Registration

There is a 2-step process for creating bots in the Microsoft world:

1 - first, create the bot here https://dev.botframework.com/bots
- To create a new bot: https://dev.botframework.com/bots/new

2 - Then create an 'app' for it in Azure 
- Go to https://portal.azure.com
    - Go to `App registrations`
    - (or just go here, which might not work: https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)

We have a few bots/apps that have been created in the botframework site, they are:

#### CodeStream (prod)
7cf49ab7-8b65-4407-b494-f02b525eef2b

#### CodeStream-QA
a0b30480-2944-46a6-97ca-192a655cdb62

#### CodeStream-PD
1a08df08-b652-464a-bac3-bfa386dcfa6d

#### CodeStream-Brian
7bce9cff-9fd1-4e05-b7b5-5638ec468880

Note: these GUIDs are created via Azure (step 2 above)

MS Teams apps are essentially just a manifest.json file that dictates its various configuration settings and features. Bots are 
optional and are part of the app's manifest. You will need to set a username/password (via azure) for these bots, the api_server will require them.


## Developing
Use the App Studio app from within the Teams app to test your app's manifest, as well as serve as a UI for editing it. From here, you can attach the bot, as well as install it locally for testing

https://aka.ms/InstallTeamsAppStudio


## Manifest

run the following commands to generate the env=specific manifest file(s)
```
node bin/cs_msteams_bot_manifest_creator.js -b 7bce9cff-9fd1-4e05-b7b5-5638ec468880 -e brian

node bin/cs_msteams_bot_manifest_creator.js -b 1a08df08-b652-464a-bac3-bfa386dcfa6d -e pd

node bin/cs_msteams_bot_manifest_creator.js -b a0b30480-2944-46a6-97ca-192a655cdb62 -e qa

node bin/cs_msteams_bot_manifest_creator.js -b 7cf49ab7-8b65-4407-b494-f02b525eef2b -e prod
```

## Publishing

Zip the inner contents of the environment you're targetting (should be 3 files: 1 manifest, 2 images)

https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/publish

https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/overview

## Dev logic

the `hasSharing` flag is enabled for `modules/msteams_auth/msteams_auth.js`. While MS Teams does not follow the same flow
as Slack, it does share a lot of the glue that makes it work -- as it follows the notion of it being a `provider`. As user triggers this flow in the IDE by attempting to add an `MS Teams Organization` from the codemark sharing dropdown.

### Installation
One of the users in the MS Teams organization will have to install the CodeStream for MS Teams app. At this point, it will be available for the entire team, though one of the users (that is also a CodeStream user) will have to link their MS Teams organization (known as a tenant) to a CodeStream user/team.

### SignIn
A user gets associated with CodeStream by signing into CodeStream via the web by issuing the `signin` command from the personal CodeStream bot chat. This eventually creates a `signinToken` which is tied to the CS `userId`, CS `teamId` and the MS Teams `tenantId`. If a user is on > 1 team, they will be prompted with a team selector. 

When a CS team gets associated, we store on `team` an entry in `providerIdentities` in the format of `msteams::<tenantId>` and we store info about that connection in `providerBotInfo` (not to be confused with `providerInfo` which deals with a team's auth/chat provider)

### Connecting
Once a user has signed in, they can connect the bot to any team channel on any team in any 
of the teams for that tenant. Upon connecting, we store a reference to the MS Teams team in `msteams_team`,
along with the _conversation_ (aka channel) and store that in `msteams_conversations`. Once this happens we update all the users on the team, giving them a `providerInfo.<teamId>.msteams.multiple.<tenantId>` object. Here, the accessToken doesn't matter, it just needs to be a string. We don't actually need an accessToken, as we will be querying teams/conversations that are gathered from the MS Teams CodeStream bot.

## Bot Commands
These are the commands that you can issue the CodeStream bot for msteams

### secret commands
These are unlisted commands. There's nothing "secret" about that, just that they're more intended for debugging rather than for the MS Teams user

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
Doesn't really do anything

### public channels
These commands only work in public channels:

```connect```
Adds this channel as a possible target for codemark sharing

```disconnect```
Removes this channel as a possible target for codemark charing

### any channel
These commands work anywhere: 

```help``` shows a help link

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

