
PUBNUB_KEY_FILE=$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset
MAIL_SECRETS_FILE=$HOME/.codestream/codestream-services/prod-mailin

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=prod.codestream.com
export CS_MAILIN_API_HOST=api.codestream.com
export CS_MAILIN_API_PORT=443
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new
