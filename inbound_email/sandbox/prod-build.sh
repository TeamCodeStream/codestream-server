
export CS_MAILIN_ASSET_ENV=dev
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-CI_Keyset"

export CS_MAILIN_API_PORT=38201

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=ci.codestream.com
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new
