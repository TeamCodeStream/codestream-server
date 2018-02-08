

PUBNUB_KEYSET=$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=qa.codestream.com
export CS_MAILIN_API_HOST=qa-api.codestream.us
export CS_MAILIN_API_PORT=443
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new

OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/qa-mailin
[ ! -f $OTHER_SECRETS_FILE ] && echo "secrets file ($OTHER_SECRETS_FILE) not found"
. $OTHER_SECRETS_FILE
export CS_MAILIN_SECRET="$INBOUND_EMAIL_SECRET"
