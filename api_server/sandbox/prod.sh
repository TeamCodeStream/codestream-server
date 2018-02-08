
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset"
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/prod-codestream-dbowner"
SSL_CERT=codestream.com

. $CS_API_TOP/sandbox/defaults.sh

OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/prod-api
[ ! -f $OTHER_SECRETS_FILE ] && echo "secrets file ($OTHER_SECRETS_FILE) not found"
. $OTHER_SECRETS_FILE
export CS_API_AUTH_SECRET="$AUTH_SECRET"
export CS_API_INBOUND_EMAIL_SECRET="$INBOUND_EMAIL_SECRET"

unset CS_API_SETUP_MONGO
export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=prod.codestream.com
export CS_API_EMAIL_TO=on
