
export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_Lambda
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS='"subnet-c538ff98","subnet-2730ae43"'
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS='"sg-32387241"'
. /home/web/.codestream/mongo/pd-codestream-api
export CS_OUTBOUND_EMAIL_MONGO_URL=mongodb://$MONGO_HOST:$MONGO_PORT/$MONGO_DB
