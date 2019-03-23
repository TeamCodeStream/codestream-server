
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=${CS_MAILIN_ENV}.codestream.com
export CS_MAILIN_API_HOST=${CS_MAILIN_ENV}-api.codestream.us
export CS_MAILIN_API_PORT=443
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new
