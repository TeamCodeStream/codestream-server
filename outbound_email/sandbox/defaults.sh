
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  CS_OUTBOUND_EMAIL_NAME     Name of the installed sandbox (installation specific)
#  CS_OUTBOUND_EMAIL_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh)
#  CS_OUTBOUND_EMAIL_SANDBOX  Path to the root directory of the sandbox tree


# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
# export CS_OUTBOUND_EMAIL_YARN=true
# export CS_OUTBOUND_EMAIL_YARN_VER=latest
# export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/yarn/bin:$PATH


# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_OUTBOUND_EMAIL_NODE_VER=8.11.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH

# Uncomment if you want to short circuit the sandbox hooks (see hooks/git_hooks.sh)
# export CS_OUTBOUND_EMAIL_DISABLE_GIT_HOOKS=1

# Add sandbox utilities to the search path
export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

# Standard variables to consider using
#export CS_OUTBOUND_EMAIL_LOGS=$CS_OUTBOUND_EMAIL_SANDBOX/log    # Log directory
#export CS_OUTBOUND_EMAIL_TMP=$CS_OUTBOUND_EMAIL_SANDBOX/tmp     # temp directory
#export CS_OUTBOUND_EMAIL_CONFS=$CS_OUTBOUND_EMAIL_SANDBOX/conf  # config files directory
#export CS_OUTBOUND_EMAIL_DATA=$CS_OUTBOUND_EMAIL_SANDBOX/data   # data directory
#export CS_OUTBOUND_EMAIL_PIDS=$CS_OUTBOUND_EMAIL_SANDBOX/pid    # pid files directory
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV"] && export CS_OUTBOUND_EMAIL_ASSET_ENV=local

#[ -z "$MONGO_ACCESS_FILE" ] && MONGO_ACCESS_FILE="$HOME/.codestream/mongo/mongo-access"
if [ -n "$MONGO_ACCESS_FILE" -a -f "$MONGO_ACCESS_FILE" ]; then
	. $MONGO_ACCESS_FILE
	[ -n "$MONGO_HOST" ] && export CS_OUTBOUND_EMAIL_MONGO_HOST=$MONGO_HOST
	[ -n "$MONGO_PORT" ] && export CS_OUTBOUND_EMAIL_MONGO_PORT=$MONGO_PORT
	[ -n "$MONGO_URL" ] && export CS_OUTBOUND_EMAIL_MONGO_URL=$MONGO_URL
	[ -n "$MONGO_APP_USER" ] && export CS_OUTBOUND_EMAIL_MONGO_USER=$MONGO_APP_USER
	[ -n "$MONGO_APP_PASS" ] && export CS_OUTBOUND_EMAIL_MONGO_PASS=$MONGO_APP_PASS
	[ -n "$MONGO_DB" ] && export CS_OUTBOUND_EMAIL_MONGO_DATABASE=$MONGO_DB
else
	# Take the values from the mongo sandbox in the playground
	TUNNEL_IP=`netstat -rn|grep '^10\.99'|grep -v '/'|awk '{print $1}'`
	export CS_OUTBOUND_EMAIL_MONGO_HOST=$TUNNEL_IP
	export CS_OUTBOUND_EMAIL_MONGO_PORT=27017
	export CS_OUTBOUND_EMAIL_MONGO_DATABASE=codestream
	# Define these to tell the API service to use mongo authentication
	#export CS_OUTBOUND_EMAIL_MONGO_USER=api
	#export CS_OUTBOUND_EMAIL_MONGO_PASS=api
fi

[ -z "$SENDGRID_CREDENTIALS_FILE" ] && SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/development
if [ -f $SENDGRID_CREDENTIALS_FILE ]; then
	. $SENDGRID_CREDENTIALS_FILE
	export CS_OUTBOUND_EMAIL_SENDGRID_SECRET="$SENDGRID_SECRET"
else
	echo "******************************************************************"
	echo "WARNING: SendGrid token file not found. Run dt-update-secrets and"
	echo "         reload your sandbox"
	echo "******************************************************************"
fi

[ -z "$PUBNUB_KEY_FILE" ] && PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-Local_Keyset_1"
if [ -f $PUBNUB_KEY_FILE ]; then
	. $PUBNUB_KEY_FILE
	export CS_OUTBOUND_EMAIL_PUBNUB_PUBLISH_KEY=$PUBNUB_PUBLISH
	export CS_OUTBOUND_EMAIL_PUBNUB_SUBSCRIBE_KEY=$PUBNUB_SUBSCRIBE
	export CS_OUTBOUND_EMAIL_PUBNUB_SECRET=$PUBNUB_SECRET
else
	echo "**************************************************************"
	echo "WARNING: pubnub key files not found. Run dt-update-secrets and"
	echo "         reload your sandbox"
	echo "**************************************************************"
fi

export CS_OUTBOUND_EMAIL_NOTIFICATION_INTERVAL=300000
export CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT=600000
export CS_OUTBOUND_EMAIL_SQS=dev_${DT_USER}_outboundEmail

export CS_OUTBOUND_EMAIL_SENDER_EMAIL=alerts@codestream.com
export CS_OUTBOUND_EMAIL_SUPPORT_EMAIL=support@codestream.com
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=dev.codestream.com
export CS_OUTBOUND_EMAIL_TO="${DT_USER}@codestream.com"

export CS_OUTBOUND_EMAIL_LAMBDA_RUNTIME=nodejs8.10
export CS_OUTBOUND_EMAIL_AWS_ACCOUNT=564564469595
export CS_OUTBOUND_EMAIL_LAMBDA_IAM_ROLE=lambda_basic_execution_with_sqs
export CS_OUTBOUND_EMAIL_SQS_ARN="arn:aws:sqs:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:$CS_OUTBOUND_EMAIL_SQS"
export CS_OUTBOUND_EMAIL_SNS_TOPIC_ARN="arn:aws:sns:us-east-1:$CS_OUTBOUND_EMAIL_AWS_ACCOUNT:dev_UnprocessedOutboundEmailEvents"
