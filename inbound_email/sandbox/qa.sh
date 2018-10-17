
PUBNUB_KEY_FILE=$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset
MAIL_SECRETS_FILE=$HOME/.codestream/codestream-services/qa-mailin

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=qa.codestream.com
export CS_MAILIN_API_HOST=qa-api.codestream.us
export CS_MAILIN_API_PORT=443
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new
