
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"
#MONGO_ACCESS_FILE=
#SSL_CERT=
#MIXPANEL_TOKEN_FILE=
#BOT_SECRETS_FILE=
#OTHER_SECRETS_FILE=

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_PORT=9443
export CS_API_EMAIL_TO=on
export CS_API_REPLY_TO_DOMAIN=pd.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="dev_pd_outboundEmail"
export CS_API_SLACKBOT_ORIGIN=http://pd-bot.codestream.us:11079
export CS_API_TEAMSBOT_ORIGIN=http://pd-bot.codestream.us:10079
export CS_API_WEB_CLIENT_ORIGIN=http://pd-app.codestream.us:1380
unset CS_API_SUPPRESS_EMAILS
