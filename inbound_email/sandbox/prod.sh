

PUBNUB_KEYSET=$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=prod.codestream.com
export CS_MAILIN_API_HOST=api.codestream.com
export CS_MAILIN_API_PORT=443
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new

OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/prod-mailin
[ ! -f $OTHER_SECRETS_FILE ] && echo "secrets file ($OTHER_SECRETS_FILE) not found"
. $OTHER_SECRETS_FILE
export CS_MAILIN_SECRET="$INBOUND_EMAIL_SECRET"
