
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset"
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/qa-codestream-dbowner"

. $CS_API_TOP/sandbox/defaults.sh

OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/qa-api
[ ! -f $OTHER_SECRETS_FILE ] && echo "secrets file ($OTHER_SECRETS_FILE) not found"
. $OTHER_SECRETS_FILE
export CS_API_AUTH_SECRET="$AUTH_SECRET"
export CS_API_INBOUND_EMAIL_SECRET="$INBOUND_EMAIL_SECRET"

unset CS_API_SETUP_MONGO
export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=qa.codestream.com
export CS_API_EMAIL_TO=on
export CS_API_OUTBOUND_EMAIL_SQS="qa_outboundEmail"
