
export CS_OUTBOUND_EMAIL_ASSET_ENV=prod
SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/prod-api
PUBNUB_KEY_FILE=$HOME/.codestream/pubnub/CodeStream-Production-Prod_Keyset
MONGO_ACCESS_FILE=$HOME/.codestream/mongo/prod-codestream-dbowner
export CS_OUTBOUND_EMAIL_SQS=prod_outboundEmail

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

unset CS_OUTBOUND_EMAIL_TO
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=codestream.com
export CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE=lambda-func.generic.template.json
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS='"subnet-bb077ee6","subnet-b2d7fdd6"'
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS='"sg-32387241"'
