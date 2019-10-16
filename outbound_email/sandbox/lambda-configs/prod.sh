
export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=cs_Lambda
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=$(dt-aws-vpc --subnet-names csdev_prod_priv1b,csdev_prod_priv1c --to-id --format csv)
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=$(dt-aws-sg --sg-names csdev_closed --to-id --format csv)
