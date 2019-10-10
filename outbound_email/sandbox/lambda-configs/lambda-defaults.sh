
# lambda function defaults

if [ -z "$CS_LAMBDA_VERSION" ]; then
	if [ -n "$TCBUILD_ASSET_FULL_NAME" ]; then
		export CS_LAMBDA_VERSION=$TCBUILD_ASSET_FULL_NAME
	else
		export CS_LAMBDA_VERSION="`get-json-property -j $CS_OUTBOUND_EMAIL_TOP/package.json -p name`-`get-json-property -j $CS_OUTBOUND_EMAIL_TOP/package.json -p version`"
	fi
fi

if [ -n "$CS_OUTBOUND_EMAIL_CFG_FILE" -o -n "$CSSVC_CFG_FILE" ]; then
	# For local sandboxes, print a helpful message on how to switch
	# between running as a lambda function vs. a local node process.
	if [ "$CS_OUTBOUND_EMAIL_ENV" == local ]; then
		if [ -z "$CS_OUTBOUND_EMAIL_NO_LAMBDA" ]; then
			echo "
Your sandbox is configured for deployment as a lambda function.
If you want to run it as a node service on this computer run this
command, kill this shell and re-load your sandbox.

   $ echo CS_OUTBOUND_EMAIL_NO_LAMBDA=1 >> $CS_OUTBOUND_EMAIL_SANDBOX/sb.options
"
		else
			echo "
Your sandbox is configured to run as a node service on this host. If
you want to run it as a lambda function, remove the setting line
from $CS_OUTBOUND_EMAIL_SANDBOX/sb.options, kill the shell and reload
the sandbox.
"
		fi
	fi
	# Override the default config file setting for deployment as a lambda
	# function because the config file needs to be included in the zip
	# file that gets uploaded to AWS
	[ -z "$CS_OUTBOUND_EMAIL_NO_LAMBDA" ] && export CS_OUTBOUND_EMAIL_CFG_FILE=./codestream-services-config.json
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
