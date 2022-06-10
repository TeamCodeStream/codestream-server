# Integration with Slack

CodeStream's Slack integration allows for sharing codemark comments inside Slack
channels. Once a CodeStream user completes the OAuth process with Slack and
receives their access token, they are able to cross-post their CodeStream
codemarks & replies to Slack.

From within a Slack channel, those cross-posted messages use Slack's
**Interactive Components** App feature to allow Slack users to send replies back
to CodeStream. Since this feature allows for only one callback URL per app, a
dedicated CodeStream Slack App for each CodeStream environment is required.

With the Slack v3 implementation, users can reply to messages in Slack threads
and have those messages be synchronized back to CodeStream. This uses Slack's
Events API, which requires a single URL be configured per Slack App.

All requests made by slack are signed and verified using [Slack's procedure for
doing so](https://api.slack.com/docs/verifying-requests-from-slack).


## Create the Slack App

Steps to create a Slack App for a non-production CodeStream environment.

1. Create a Slack App for connecting to CodeStream with the following
   settings.

	*	Go to https://api.slack.com/apps, make sure you're logged in to your
		workspace with administrative privileges, and press **Create New App**. We
		recommend naming it **CodeStream \<environment\>**.
	*   Select the **OAuth & Permissions** feature, make these settings and save
		them.
		*   Add the following Redirect URL:
			- `https://<codestream-api-host>/no-auth/provider-token/slack`
		*	Add the following **Bot Token Scopes** and save them (Request reasons included
			here). _NOTE: the source of truth for the list of scopes is [here](../../modules/slack_auth/slack_auth.js).
			You should verify this list accordingly._
			- **channels:history** - We receive message events for messages
			posted to public channels the bot has access to.
			- **channels:read** - We fetch information about public channels the
			bot has access to.
			- **chat:write** - We post messages to watched threads as the bot on
			behalf of users.
			- **groups:history** - We receive message events for messages
			posted to public channels the bot has access to.
			- **groups:read** - We fetch information about private channels the
			bot has access to.
			- **mpim:history** - We receive message events for messages posted
			to group DMs the bot has access to.
			- **mpim:read** - We fetch information about group DMs the bot has
			access to.
			- **users:read** - We fetch information about users.
			- **users:read.email** - We try to correlate CodeStream accounts
			with Slack accounts via e-mail.
		*	Add the following **User Token Scopes** and save them (Request reasons included
			here). _NOTE: the source of truth for the list of scopes is [here](../../modules/slack_auth/slack_auth.js).
			You should verify this list accordingly._
			- **channels:read** - We allow users to select a public channel to share
			to.
			- **channels:write** - We allow users to invite the CodeStream bot
			to public channels.
			- **chat:write** - Users can send a copy of their messages from
			CodeStream to slack.
			- **groups:read** - We allow users to select a private channel to share
			to.
			- **groups:write** - We allow users to invite the CodeStream bot to
			private channels.
			- **im:read** - We allow users to select a direct message to share to.
			- **mpim:read** - We allow users to select a group DM to share to.
			- **mpim:write** - We allow users to create group DMs to share to.
			- **users.profile:write** - We can update your slack status to reflect
			your current work.
			- **users:read** - We show the list of users.
			- **users:read.email** - We try to correlate CodeStream accounts with
			slack accounts via e-mail.
	*	Select the **Interactivity & Shortcuts** section, make these settings
		and save them.
		*	Turn on Interactivity (the switch on the upper right)
		*	Add the following Request URL:
			- `https://<codestream-api-host>/no-auth/provider-action/slack`
	*	Select the **Event Subscriptions** section and do the following then save them.
		*	Enable events (on)
		*	Set the Request URL to `https://<codestream-api-host>/no-auth/provider-action/slack-events`
			(note the server needs to be running to respond to this request when you configure it)
		*	In the **Subscribe to Bot Events** section, add these bot user events:
			- message.channels
			- message.groups
			- message.mpim

## Add and/or Distribute Slack App

Add and/or distribute the Slack App as needed. It will need to be added to any
workspaces that wish to connect with the corresponding CodeStream environment.

## Update the CodeStream Configuration

Finally, add the secrets and configuration data to the CodeStream API server's
configuration file in the **integrations** section.

From the **Basic Information** page of the Slack App, get these data and add
them to the CodeStream configuration file.

- App ID
- Client ID
- Client Secret
- Signing Secret


```
{
	"integrations": {
		"slack": {
			"cloud": {
				"appClientId": null,
				"appClientSecret": null,
				"appId": null,
				"appSharingClientId": "*******************************",
				"appSharingClientSecret": "********************************",
				"appSharingId": "***************************",
				"appSharingSigningSecret": "**************************",
				"appSigningSecret": null,
				"appStrictClientId": null,
				"appStrictClientSecret": null,
				"appStrictId": null,
				"appStrictSigningSecret": null,
				"disabled": false,
				"interactiveComponentsEnabled": true
			}
		}
	}
}
```

## Permalink to Code Requesting Auth

This is the _source of truth_ where slack access is concerned.
