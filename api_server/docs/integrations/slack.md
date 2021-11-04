# Integration with Slack

CodeStream's Slack integration allows for sharing codemark comments inside Slack
channels. Once a CodeStream user completes the OAuth process with Slack and
receives their access token, they are able to cross-post their CodeStream
codemarks & replies to Slack.

From within a Slack channel, those cross-posted messages use Slack's
**Interactive Components** App feature to allow Slack users to send replies back
to CodeStream. Since this feature allows for only one callback URL per app, a
dedicated CodeStream Slack App for each CodeStream environment is required.

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
        *   Add the following Scopes and save them (Request reasons included here):
            - **channels:read** - We allow users to select a public channel to share
            to.
            - **chat:write** - Users can send a copy of their messages from
            CodeStream to slack.
            - **groups:read** - We allow users to select a private channel to share
            to.
            - **im:read** - We allow users to select a direct message to share to.
            - **mpim:read** - We allow users to select a group DM to share to.
            - **users.profile:write** - We can update your slack status to reflect
            your current work.
            - **users:read** - We show the list of users.
            - **users:read.email** - We try to correlate CodeStream accounts with
            slack accounts via e-mail.
    *   Select the **Interactivity & Shortcuts** section, make these settings
        and save them.
        *   Turn on Interactivity (the switch on the upper right)
        *   Add the following Request URL:
            - `https://<codestream-api-host>/no-auth/provider-action/slack`

## Add and/or Distribute Slack App

Add and/or distribute the Slack App as needed. It will need to be added to any
workspaces that wish to connect with the corresponding CodeStream environment.

## Update the CodeStream Configuration

Finally, add the secrets and configuration data to the CodeStream API server's
configuration file. The following data is needed:

From the **Basic Information** page of the Slack App, get these data and add
them to the CodeStream configuration file.

- App ID
- Client ID
- Client Secret
- Signing Secret
