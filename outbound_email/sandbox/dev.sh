
export CS_OUTBOUND_EMAIL_ASSET_ENV=dev
[ -z "$CS_OUTBOUND_EMAIL_ENV" ] && echo "CS_OUTBOUND_EMAIL_ENV not set" && return 1
export CS_OUTBOUND_EMAIL_SQS=${CS_OUTBOUND_EMAIL_ASSET_ENV}_outboundEmail
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=${CS_OUTBOUND_EMAIL_ENV}.codestream.com
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/pd-codestream-api"

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

unset CS_OUTBOUND_EMAIL_TO
