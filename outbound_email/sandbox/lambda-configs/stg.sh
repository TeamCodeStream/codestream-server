
export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_${CSSVC_ENV}_mailout_lambda
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=$(dt-aws-vpc --subnet-names csdev_${CSSVC_ENV}_priv1b,csdev_${CSSVC_ENV}_priv1c,csdev_${CSSVC_ENV}_priv1d --to-id --format csv)
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=$(dt-aws-sg --sg-names csdev_${CSSVC_ENV}_mailout --to-id --format csv)
