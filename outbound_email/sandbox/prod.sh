
export CS_OUTBOUND_EMAIL_ASSET_ENV=prod
export CS_OUTBOUND_EMAIL_ENV=prod
export CS_OUTBOUND_EMAIL_SQS=prod_outboundEmail
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=prod.codestream.com
SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/prod-api
PUBNUB_KEY_FILE=$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset
MONGO_ACCESS_FILE=$HOME/.codestream/mongo/prod-codestream-dbowner

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

unset CS_OUTBOUND_EMAIL_TO
