
# This provdes the runtime environment for PD

PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"
#MONGO_ACCESS_FILE=
#SSL_CERT=
#MIXPANEL_TOKEN_FILE=
#BOT_SECRETS_FILE=
#OTHER_SECRETS_FILE=
export CS_API_ASSET_ENV=dev

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_PORT=9443
export CS_API_REPLY_TO_DOMAIN=pd.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="pd_outboundEmail"
export CS_API_WEB_CLIENT_ORIGIN=http://pd-app.codestream.us:1380
export CS_API_PUBLIC_URL=https://pd-api.codestream.us:$CS_API_PORT
unset CS_API_SUPPRESS_EMAILS
