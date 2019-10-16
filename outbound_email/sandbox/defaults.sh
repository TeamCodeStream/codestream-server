
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  CS_OUTBOUND_EMAIL_NAME     Name of the installed sandbox (installation specific)
#  CS_OUTBOUND_EMAIL_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh)
#  CS_OUTBOUND_EMAIL_SANDBOX  Path to the root directory of the sandbox tree

# Additional shell functions
. $DT_TOP/lib/sandbox_utils.sh

# ========== Optional override settings ==========
sandutil_load_options $CS_OUTBOUND_EMAIL_SANDBOX || { echo "failed to load options" >&2 && return 1; }


# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
# export CS_OUTBOUND_EMAIL_YARN=true
# export CS_OUTBOUND_EMAIL_YARN_VER=latest
# export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/yarn/bin:$PATH


# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_OUTBOUND_EMAIL_NODE_VER=10.15.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH
# export CS_OUTBOUND_EMAIL_NPM_INSTALL_XTRA_OPTS=

# Uncomment if you want to short circuit the sandbox hooks (see hooks/git_hooks.sh)
# export CS_OUTBOUND_EMAIL_DISABLE_GIT_HOOKS=1

# Add sandbox utilities to the search path
export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

# Standard variables to consider using
export CS_OUTBOUND_EMAIL_LOGS=$CS_OUTBOUND_EMAIL_SANDBOX/log    # Log directory
# comment out if you do not want log messages to get sent to the console
export CS_OUTBOUND_EMAIL_TMP=$CS_OUTBOUND_EMAIL_SANDBOX/tmp     # temp directory
export CS_OUTBOUND_EMAIL_CONFS=$CS_OUTBOUND_EMAIL_SANDBOX/conf  # config files directory
export CS_OUTBOUND_EMAIL_DATA=$CS_OUTBOUND_EMAIL_SANDBOX/data   # data directory
export CS_OUTBOUND_EMAIL_PIDS=$CS_OUTBOUND_EMAIL_SANDBOX/pid    # pid files directory
export CS_OUTBOUND_EMAIL_LOG_CONSOLE_OK=1

[ -z "$CS_OUTBOUND_EMAIL_ENV" ] && export CS_OUTBOUND_EMAIL_ENV=local
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV" ] && export CS_OUTBOUND_EMAIL_ASSET_ENV=local

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
	# Take the values from the vpn tunnel
	MY_IP=$(sandutil_get_tunnel_ip fallbackLocalIp)
	[ -z "$MY_IP" -a -n "$MDB_HOST" ] && MY_IP=$MDB_HOST
	export CS_OUTBOUND_EMAIL_MONGO_HOST=$MY_IP
	export CS_OUTBOUND_EMAIL_MONGO_PORT=27017
	export CS_OUTBOUND_EMAIL_MONGO_DATABASE=codestream
	echo "outbound email mongo host = $CS_OUTBOUND_EMAIL_MONGO_HOST"
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

[ -z "$CS_OUTBOUND_EMAIL_NOTIFICATION_INTERVAL" ] && export CS_OUTBOUND_EMAIL_NOTIFICATION_INTERVAL=300000
[ -z "$CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT" ] && export CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT=600000
[ -z "$CS_OUTBOUND_EMAIL_SQS" ] && export CS_OUTBOUND_EMAIL_SQS=local_${DT_USER}_outboundEmail

[ -z "$CS_OUTBOUND_EMAIL_SENDER_EMAIL" ] && export CS_OUTBOUND_EMAIL_SENDER_EMAIL=alerts@codestream.com
[ -z "$CS_OUTBOUND_EMAIL_SUPPORT_EMAIL" ] && export CS_OUTBOUND_EMAIL_SUPPORT_EMAIL=support@codestream.com
[ -z "$CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN" ] && export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=local.codestream.com
# set to a valid email to have all emails diverted to the specified address,
# this is good and risk-free for developer testing
[ -z "$CS_OUTBOUND_EMAIL_TO" ] && export CS_OUTBOUND_EMAIL_TO="${DT_USER}@codestream.com"


# Added for On-Prem work

# Uncomment if running with the broadcaster service
# export CS_OUTBOUND_EMAIL_SOCKET_CLUSTER_HOST=localhost.codestream.us
# export CS_OUTBOUND_EMAIL_SOCKET_CLUSTER_PORT=12443

# This must match CS_BROADCASTER_AUTH_SECRET
# export CS_OUTBOUND_EMAIL_BROADCASTER_SECRET=.......

# ============ RabbitMQ (on-prem) ============
# If CS_OUTBOUND_EMAIL_RABBITMQ_HOST is set, outbound email service will use rabbitMQ and NOT AWS SQS
[ -z "$RABBITMQ_ACCESS_FILE" ] && RABBITMQ_ACCESS_FILE=$HOME/.codestream/codestream/local-rabbitmq
if [ -f $RABBITMQ_ACCESS_FILE ]; then
	. $RABBITMQ_ACCESS_FILE
	export CS_OUTBOUND_EMAIL_RABBITMQ_HOST=$RABBITMQ_HOST
	export CS_OUTBOUND_EMAIL_RABBITMQ_PORT=$RABBITMQ_PORT
	export CS_OUTBOUND_EMAIL_RABBITMQ_USER=$RABBITMQ_USER
	export CS_OUTBOUND_EMAIL_RABBITMQ_PASSWORD=$RABBITMQ_PASS
fi
