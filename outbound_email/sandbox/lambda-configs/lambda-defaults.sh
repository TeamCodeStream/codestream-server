
# configure shell for lambda function deployment
. $DT_TOP/lib/sandbox_utils.sh

[ -z "$CS_OUTBOUND_EMAIL_SQS" ] && echo "AWS SQS is not configured as the queing engine. That is a pre-req for deploying as a lambda function." && return 1

export CS_OUTBOUND_EMAIL_CFG_FILE=./codestream-services-config.json

# For local development, reset the mongo connection string
# to reference mongo at the vpn ip address
if [ "$CS_OUTBOUND_EMAIL_ENV" == "local" ]; then
	TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp)
	[ -n "$TUNNEL_IP" ] && export CS_OUTBOUND_EMAIL_MONGO_URL=mongodb://$TUNNEL_IP/codestream
	[ -n "$OUTBOUND_EMAIL_MONGO_URL" ] && echo "overriding mongo connection string: $CS_OUTBOUND_EMAIL_MONGO_URL"
fi

if [ -z "$CS_LAMBDA_VERSION" ]; then
	if [ -n "$TCBUILD_ASSET_FULL_NAME" ]; then
		export CS_LAMBDA_VERSION=$TCBUILD_ASSET_FULL_NAME
	else
		export CS_LAMBDA_VERSION="`get-json-property -j $CS_OUTBOUND_EMAIL_TOP/package.json -p name`-`get-json-property -j $CS_OUTBOUND_EMAIL_TOP/package.json -p version`"
	fi
fi

[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE" ] && export CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE=lambda-func.generic.template.json
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME" ] && export CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME="nodejs12.x"
[ -z "$CS_OUTBOUND_EMAIL_AWS_ACCOUNT" ] && export CS_OUTBOUND_EMAIL_AWS_ACCOUNT=564564469595
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE" ] && export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_LambdaDevelopment
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION" ] && export CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION="outbound email gateway for $CS_OUTBOUND_EMAIL_ENV"
#export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=
#export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=

[ -z "$CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN" ] && export CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN="arn:aws:sns:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:dev_UnprocessedOutboundEmailEvents"
[ -z "$CS_OUTBOUND_EMAIL_SQS_ARN" ] && export CS_OUTBOUND_EMAIL_SQS_ARN="arn:aws:sqs:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:$CS_OUTBOUND_EMAIL_SQS"

if [ -z "$CS_OUTBOUND_EMAIL_LAMBDA_ENV_FILE" ]; then
	[ ! -f $CS_OUTBOUND_EMAIL_TOP/sandbox/lambda-configs/$CS_OUTBOUND_EMAIL_ENV.sh ] && CS_OUTBOUND_EMAIL_LAMBDA_ENV_FILE=dev.sh || CS_OUTBOUND_EMAIL_LAMBDA_ENV_FILE=$CS_OUTBOUND_EMAIL_ENV.sh
fi
. $CS_OUTBOUND_EMAIL_TOP/sandbox/lambda-configs/$CS_OUTBOUND_EMAIL_LAMBDA_ENV_FILE
echo "Your environment is now setup to install a lambda func using the $CS_OUTBOUND_EMAIL_LAMBDA_ENV_FILE env file."
