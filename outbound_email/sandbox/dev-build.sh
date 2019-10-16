
# sandbox configuration for building development asset

export CS_OUTBOUND_EMAIL_ASSET_ENV=dev
export CS_OUTBOUND_EMAIL_ENV=ci
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-CI_Keyset"
export CS_OUTBOUND_EMAIL_SQS=ci_outboundEmail

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

export CS_OUTBOUND_EMAIL_MONGO_HOST=localhost.codestream.us
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=ci.codestream.com
unset CS_OUTBOUND_EMAIL_TO
