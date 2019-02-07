
# This provides the runtime environment for QA

#SSL_CERT=
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/qa-codestream-dbowner"
#SLACK_API_ACCESS_FILE=$HOME/.codestream/slack/production
#TRELLO_API_ACCESS_FILE=
#GITHUB_API_ACCESS_FILE=$HOME/.codestream/github/production
#ASANA_API_ACCESS_FILE=$HOME/.codestream/asana/production
#ATLASSIAN_API_ACCESS_FILE=$HOME/.codestream/atlassian/production
#GITLAB_API_ACCESS_FILE=$HOME/.codestream/gitlab/production
#BITBUCKET_API_ACCESS_FILE=$HOME/.codestream/bitbucket/production
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset"
#MIXPANEL_TOKEN_FILE=
OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/qa-api

export CS_API_ASSET_ENV=prod
export CS_API_ENV=qa
export CS_API_MARKETING_SITE_URL=https://www.codestream.com

. $CS_API_TOP/sandbox/defaults.sh

unset CS_API_SETUP_MONGO
export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=qa.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="qa_outboundEmail"
export CS_API_WEB_CLIENT_ORIGIN=https://qa-app.codestream.us
export CS_API_PUBLIC_URL=https://qa-api.codestream.us
unset CS_API_SUPPRESS_EMAILS
