
export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_Lambda
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=$(dt-aws-vpc --subnet-names csdev_{{env}}_priv_{{awsAzId}},csdev_{{env}}_pub_{{awsAzId}} --to-id --format csv --to-id --kvlist env:$CS_OUTBOUND_EMAIL_ENV)
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=$(dt-aws-sg --sg-names csdev_closed --to-id --format csv)
