
export CS_MAILIN_ASSET_ENV=dev
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-CI_Keyset"
MAIL_SECRETS_FILE=$HOME/.codestream/codestream-services/ci-api

export CS_MAILIN_API_PORT=38101

. $CS_MAILIN_TOP/sandbox/defaults.sh

export CS_MAILIN_REPLY_TO_DOMAIN=ci.codestream.com
export CS_MAILIN_DIRECTORY=$HOME/codestream-mail/inbound/web/new
