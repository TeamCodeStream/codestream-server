
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset"
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/prod-codestream-dbowner"
SSL_CERT=codestream.com
SLACK_API_ACCESS_FILE=$HOME/.codestream/slack-api/production
MIXPANEL_TOKEN_FILE=$HOME/.codestream/mixpanel/production
BOT_SECRETS_FILE=$HOME/.codestream/slackbot/codestream-production
OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/prod-api
export CS_API_ASSET_ENV=prod

. $CS_API_TOP/sandbox/defaults.sh

unset CS_API_SETUP_MONGO
export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=prod.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="prod_outboundEmail"
export CS_API_SLACKBOT_ORIGIN=http://bot.codestream.us:11079
export CS_API_TEAMSBOT_ORIGIN=http://bot.codestream.us:10079

export CS_API_WEB_CLIENT_ORIGIN=https://app.codestream.com

unset CS_API_HELP_AVAILABLE
unset CS_API_SUPPRESS_EMAILS
