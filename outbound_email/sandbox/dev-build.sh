
# export CS_OUTBOUND_EMAIL_ASSET_ENV=dev  # this should be set in sb.options

#SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/development
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"
#MONGO_ACCESS_FILE="$HOME/.codestream/mongo/abc-codestream-api"

export CS_OUTBOUND_EMAIL_SQS=${CS_OUTBOUND_EMAIL_ASSET_ENV}_outboundEmail

. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_Lambda
export CS_OUTBOUND_EMAIL_MONGO_HOST=${CS_OUTBOUND_EMAIL_ASSET_ENV}-api.codestream.us
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=${CS_OUTBOUND_EMAIL_ASSET_ENV}.codestream.com
export CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE=lambda-func.generic.template.json
# export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS='"subnet-c538ff98","subnet-2730ae43"'
# export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS='"sg-32387241"'
subnet_id=`dt-aws-tool --map-to-id --subnets csdev_${CS_OUTBOUND_EMAIL_ASSET_ENV}_priv1b --output comma-delim-string-list`
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS="$subnet_id"
sg_id=`dt-aws-tool --map-to-id --sgs csdev_closed --output comma-delim-string-list`
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=$sg_id

unset CS_OUTBOUND_EMAIL_TO
