
# This provdes a generic runtime environment
# Some variables are taken from $CS_API_SANDBOX/sb.options

PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"
#MONGO_ACCESS_FILE=
#SSL_CERT=
#MIXPANEL_TOKEN_FILE=
#BOT_SECRETS_FILE=
#OTHER_SECRETS_FILE=

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_PORT=8443
export CS_API_REPLY_TO_DOMAIN=${CS_API_ENV}.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="${CS_API_ENV}_outboundEmail"
export CS_API_WEB_CLIENT_ORIGIN=https://${CS_API_ENV}-app.codestream.us
export CS_API_PUBLIC_URL=https://${CS_API_ENV}-api.codestream.us
unset CS_API_SUPPRESS_EMAILS
