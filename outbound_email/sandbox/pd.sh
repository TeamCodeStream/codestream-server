
export CS_OUTBOUND_EMAIL_ASSET_ENV=dev
export CS_OUTBOUND_EMAIL_ENV=pd
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/pd-codestream-api"
export CS_OUTBOUND_EMAIL_SQS=pd_outboundEmail
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=pd.codestream.com

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh
unset CS_OUTBOUND_EMAIL_TO
