
# This provides the runtime environment for prod

SSL_CERT=codestream.com
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/prod-codestream-dbowner"
SLACK_API_ACCESS_FILE=$HOME/.codestream/slack/production
SLACK_STRICT_API_ACCESS_FILE="$HOME/.codestream/slack/production-strict"
# TRELLO_API_ACCESS_FILE=
GITHUB_API_ACCESS_FILE=$HOME/.codestream/github/production
ASANA_API_ACCESS_FILE=$HOME/.codestream/asana/production
ATLASSIAN_API_ACCESS_FILE=$HOME/.codestream/atlassian/production
GITLAB_API_ACCESS_FILE=$HOME/.codestream/gitlab/production
BITBUCKET_API_ACCESS_FILE=$HOME/.codestream/bitbucket/production
AZUREDEVOPS_API_ACCESS_FILE=$HOME/.codestream/microsoft/devops-production
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset"
SEGMENT_TOKEN_FILE=$HOME/.codestream/segment/prod-api
SEGMENT_WEB_TOKEN_FILE=$HOME/.codestream/segment/prod-webapp
MSTEAMS_API_ACCESS_FILE=$HOME/.codestream/microsoft/teams-production
MIXPANEL_TOKEN_FILE=$HOME/.codestream/mixpanel/production
INTERCOM_TOKEN_FILE=$HOME/.codestream/intercom/production
OTHER_SECRETS_FILE=$HOME/.codestream/codestream/prod-api

export CS_API_ASSET_ENV=prod
export CS_API_ENV=prod
export CS_API_AUTH_ORIGIN=https://api.codestream.com/no-auth
export CS_API_MARKETING_SITE_URL=https://www.codestream.com

. $CS_API_TOP/sandbox/defaults.sh

unset CS_API_SETUP_MONGO
export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=prod.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="prod_outboundEmail"

export CS_API_WEB_CLIENT_ORIGIN=https://app.codestream.com
export CS_API_PUBLIC_URL=https://api.codestream.com

unset CS_API_HELP_AVAILABLE
unset CS_API_SUPPRESS_EMAILS
