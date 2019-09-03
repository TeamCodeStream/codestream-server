
# lambda function defaults

# this variable's name is generic so applies to all our lambda functions
[ -z "$CS_FUNCTION_VERSION" ] && export CS_FUNCTION_VERSION="`get-json-property -j $CS_OUTBOUND_EMAIL_TOP/src/package.json -p name`-`get-json-property -j $CS_OUTBOUND_EMAIL_TOP/src/package.json -p version`"

[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE" ] && export CS_OUTBOUND_EMAIL_LAMBDA_TEMPLATE=lambda-func.generic.template.json
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME" ] && export CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME="nodejs10.x"
[ -z "$CS_OUTBOUND_EMAIL_AWS_ACCOUNT" ] && export CS_OUTBOUND_EMAIL_AWS_ACCOUNT=564564469595
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE" ] && export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_LambdaDevelopment
[ -z "$CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION" ] && export CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION="outbound email gateway for $CS_OUTBOUND_EMAIL_ENV"

#export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=
#export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=

[ -z "$CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN" ] && export CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN="arn:aws:sns:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:dev_UnprocessedOutboundEmailEvents"
[ -z "$CS_OUTBOUND_EMAIL_SQS_ARN" ] && export CS_OUTBOUND_EMAIL_SQS_ARN="arn:aws:sqs:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:$CS_OUTBOUND_EMAIL_SQS"
