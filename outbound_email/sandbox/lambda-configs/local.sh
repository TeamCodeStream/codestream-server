
export CS_OUTBOUND_EMAIL_LAMBDA_DESCRIPTION="outbound email gateway for local_$DT_USER"
export CS_OUTBOUND_EMAIL_LAMBDA_SUBNETS=$(dt-aws-vpc --to-id --subnet-names csdev_priv1b --format csv)
export CS_OUTBOUND_EMAIL_LAMBDA_SECURITY_GROUPS=$(dt-aws-sg --to-id --sg-names csdev_basic --format csv)
