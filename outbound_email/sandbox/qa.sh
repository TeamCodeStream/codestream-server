
export CS_OUTBOUND_EMAIL_ASSET_ENV=prod
export CS_OUTBOUND_EMAIL_ENV=qa
export CS_OUTBOUND_EMAIL_SQS=qa_outboundEmail
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=qa.codestream.com
SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/qa-api
PUBNUB_KEY_FILE=$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset
MONGO_ACCESS_FILE=$HOME/.codestream/mongo/qa-codestream-dbowner

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

unset CS_OUTBOUND_EMAIL_TO
