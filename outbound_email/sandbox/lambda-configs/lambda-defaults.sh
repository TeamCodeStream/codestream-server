
# lambda function defaults

if [ -z "$noConfig" ]; then
	export CS_OUTBOUND_EMAIL_CFG_FILE=./codestream-services-config.json
	echo -e "Config file reset to $CS_OUTBOUND_EMAIL_CFG_FILE for packaging lambda function\n"
fi

# when running a VPN, set the mongo connect override to reference mongo via the vpn ip (lambda functions need to connect)
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
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME" ] && export CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME="nodejs10.x"
[ -z "$CS_OUTBOUND_EMAIL_AWS_ACCOUNT" ] && export CS_OUTBOUND_EMAIL_AWS_ACCOUNT=564564469595
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE" ] && export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_LambdaDevelopment
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION" ] && export CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION="outbound email gateway for $CS_OUTBOUND_EMAIL_ENV"
#export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=
#export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=

[ -z "$CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN" ] && export CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN="arn:aws:sns:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:dev_UnprocessedOutboundEmailEvents"
[ -z "$CS_OUTBOUND_EMAIL_SQS_ARN" ] && export CS_OUTBOUND_EMAIL_SQS_ARN="arn:aws:sqs:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:$CS_OUTBOUND_EMAIL_SQS"
