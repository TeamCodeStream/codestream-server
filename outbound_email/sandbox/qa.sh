
export CS_OUTBOUND_EMAIL_ASSET_ENV=qa
SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/qa-api
PUBNUB_KEY_FILE=$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset
MONGO_ACCESS_FILE=$HOME/.codestream/mongo/qa-codestream-dbowner
export CS_OUTBOUND_EMAIL_SQS=qa_outboundEmail

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=qa.codestream.com
export CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE=lambda-func.generic.template.json
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS='"subnet-96423fcb","subnet-e7446c83"'
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS='"sg-32387241"'
