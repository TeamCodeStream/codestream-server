Registration:

There is a 2-step process for creating bots:
- first, create the bot in the botframework.com site (https://dev.botframework.com/bots)
    - https://dev.botframework.com/bots/new
- then create an 'app' for it in Azure 
    - Go to https://portal.azure.com
    - Go to `App registrations`
    - (or just go here, which might not work: https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)


These GUIDs are created via Azure:
CodeStream (prod)
7cf49ab7-8b65-4407-b494-f02b525eef2b

CodeStream-PD
1a08df08-b652-464a-bac3-bfa386dcfa6d

CodeStream-Brian
7bce9cff-9fd1-4e05-b7b5-5638ec468880



Creating:
Use the App Builder app from within the Teams app to test your manifest, as well as serve
as a UI for editing it. From here, you can attach the bot, as well as install it locally for testing


node bin/cs_msteams_bot_manifest_creator.js -b 7bce9cff-9fd1-4e05-b7b5-5638ec468880 -e brian
node bin/cs_msteams_bot_manifest_creator.js -b 1a08df08-b652-464a-bac3-bfa386dcfa6d -e pd
node bin/cs_msteams_bot_manifest_creator.js -b 7cf49ab7-8b65-4407-b494-f02b525eef2b -e prod


Dev logic:

signin: A user gets associated with CodeStream by signing into CodeStream via the web. 
This eventually creates a signinToken which is tied to the CS `userId`, CS `teamId` and the MS Teams `tenantId`. If a user is on > 1 team, they will be prompted with a team selector. This signing flow, 
happens when an MS Teams user executes the `signin` command from the personal CodeStream bot chat.

connect: Once a user has signed in, they can connect the bot to any team channel on any team in any 
of the teams for that tenant. Upon connecting, we store a reference to the MS Teams team in `msteams_team`,
along with the _conversation_ (aka channel) and store that in `msteams_conversations`

CodeStream IDE: When a user begins creating a codemark, we attempt to `GET` all the conversations that they've
connected via `/msteams_conversations`. We mix in the `teamName` from `msteams_teams`.
When the codemark is created, we `POST` to `/msteams_conversations` a few properties, but most importantly
the `codemarkId` and `conversationId`. From here, we can lookup which conversation this refers to in 
the `msteams_conversations` collection, and call a `continueConversation` method on our MS Teams bot. 
This will create, what Microsoft calls, a _proactive_ message and post the codemark to the selected channel.

When a CS team gets associated, we store on `team` an entry in `providerIdentities` in the format of `msteams::<tenantId>` and we store info about that connection in `providerBotInfo` (not to be confused with `providerInfo` which deals with a team's auth/chat provider)

