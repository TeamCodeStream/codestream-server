
# This provides an environment for building the dev asset as
# well as running supporting API sandboxes for other builds.

PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-CI_Keyset"
#MONGO_ACCESS_FILE=
#SSL_CERT=
#MIXPANEL_TOKEN_FILE=
#BOT_SECRETS_FILE=
#SLACK_API_ACCESS_FILE=
OTHER_SECRETS_FILE="$HOME/.codestream/codestream-services/ci-api"
export CS_API_ASSET_ENV=dev

# This variable can be overridden when the sandbox is installed
export CS_API_PORT=37101

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_REPLY_TO_DOMAIN=ci.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="ci_outboundEmail"
export CS_API_SENDER_EMAIL=ci-alerts@codestream.com

# These are fake ports
export CS_API_SLACKBOT_ORIGIN=http://localhost.codestream.us:37102
export CS_API_TEAMSBOT_ORIGIN=http://localhost.codestream.us:37103
export CS_API_WEB_CLIENT_ORIGIN=http://localhost.codestream.us:37104
export CS_API_PUBLIC_URL=https://localhost.codestream.us:37105
