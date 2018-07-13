
# Create default variable settings in this file

# Set by development tools
# CS_API_NAME     Name of the sandbox
# CS_API_SANDBOX  /path/to/root/of/sandbox
# CS_API_TOP      /path/to/root/of/primary/git/project

# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
export CS_API_YARN=true
export CS_API_YARN_VER=1.3.2

# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_API_NODE_VER=8.9.4

export PATH=$CS_API_SANDBOX/node/bin:$CS_API_SANDBOX/yarn/bin:$CS_API_TOP/bin:$CS_API_TOP/node_modules/.bin:$PATH
export CS_API_TOP=$CS_API_TOP
export CS_API_HOST=localhost
export CS_API_PORT=12079
export CS_API_LOG_DIRECTORY=$CS_API_SANDBOX/log
export CS_API_LOG_CONSOLE_OK=1
export CS_API_HELP_AVAILABLE=1
export CS_WEB_CLIENT_ORIGIN=http://localhost:1380

# =============== SSL Certificate ==================
[ -z "$SSL_CERT" ] && SSL_CERT=wildcard.codestream.us
export CS_API_SSL_CERT_DIR=$HOME/.certs/$SSL_CERT
[ ! -d $CS_API_SSL_CERT_DIR ] && export CS_API_SSL_CERT_DIR=/etc/pki/$SSL_CERT
export CS_API_SSL_KEYFILE=$CS_API_SSL_CERT_DIR/$SSL_CERT-key
export CS_API_SSL_CERTFILE=$CS_API_SSL_CERT_DIR/$SSL_CERT-crt
export CS_API_SSL_CAFILE=$CS_API_SSL_CERT_DIR/$SSL_CERT-ca

# ================ Mongo Settings ==================
[ -z "$CS_API_MONGO_DATABASE" ] && export CS_API_MONGO_DATABASE=codestream
[ -z "$MONGO_ACCESS_FILE" ] && MONGO_ACCESS_FILE="$HOME/.codestream/mongo/mongo-access"
if [ -f $MONGO_ACCESS_FILE ]; then
	. $MONGO_ACCESS_FILE
	[ -n "$MONGO_HOST" ] && export CS_API_MONGO_HOST=$MONGO_HOST
	[ -n "$MONGO_PORT" ] && export CS_API_MONGO_PORT=$MONGO_PORT
	[ -n "$MONGO_URL" ] && export CS_API_MONGO_URL=$MONGO_URL
	[ -n "$MONGO_APP_USER" ] && export CS_API_MONGO_USER=$MONGO_APP_USER
	[ -n "$MONGO_APP_PASS" ] && export CS_API_MONGO_PASS=$MONGO_APP_PASS
	[ -n "$MONGO_DB" ] && export CS_API_MONGO_DATABASE=$MONGO_DB
else
	# Take the values from the mongo sandbox in the playground
	export CS_API_MONGO_HOST=$MDB_HOST
	export CS_API_MONGO_PORT=$MDB_PORT
	# Define these to tell the API service to use mongo authentication
	#export CS_API_MONGO_USER=api
	#export CS_API_MONGO_PASS=api
fi

# CodeStream mongo database
export CS_API_MONGO_DATABASE=codestream

# Construct the mongo URL (needed if authentication is used)
if [ -n "$CS_API_MONGO_USER" -a -z "$CS_API_MONGO_URL" ]; then
	export CS_API_MONGO_URL="mongodb://$CS_API_MONGO_USER:$CS_API_MONGO_PASS@$CS_API_MONGO_HOST:$CS_API_MONGO_PORT/$CS_API_MONGO_DATABASE"
fi

# Define these if you want the mdb-mongo CLI to access the database
# using the system account above (as opposed to 'root')
#export MDB_CLI_USER=$CS_API_MONGO_USER
#export MDB_CLI_PASS=$CS_API_MONGO_PASS

# Tell the API service init script to setup mongo when it the api server
# is started for the first time. This includes creating the database
# owner in mongo and creating the indexes
export CS_API_SETUP_MONGO=true


# ================== SlackBot ==================
if [ -z "$BOT_SECRETS_FILE" ]; then
	if [ -f $HOME/.codestream/slackbot/codestream-local ]; then
		BOT_SECRETS_FILE=$HOME/.codestream/slackbot/codestream-local
	else
		BOT_SECRETS_FILE=$HOME/.codestream/slackbot/codestream-development
	fi
fi
if [ -f $BOT_SECRETS_FILE ]; then
	. $BOT_SECRETS_FILE
	# All bots use the same shared secret
	export CS_API_INTEGRATION_BOT_SHARED_SECRET=$SHARED_SECRET
else
	echo "*** ERROR: slackbot secrets file ($BOT_SECRETS_FILE) not found"
fi
[ -z "$CS_API_SLACKBOT_ORIGIN" ] && export CS_API_SLACKBOT_ORIGIN=http://localhost:11079
[ -z "$CS_API_TEAMSBOT_ORIGIN" ] && export CS_API_TEAMSBOT_ORIGIN=http://localhost:10079


# =============== PubNub Settings ==============
# see README.pubnub for more details
[ -z "$PUBNUB_KEY_FILE" ] && PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-Local_Keyset_1"
if [ -f $PUBNUB_KEY_FILE ]; then
	. $PUBNUB_KEY_FILE
	export CS_API_PUBNUB_PUBLISH_KEY=$PUBNUB_PUBLISH
	export CS_API_PUBNUB_SUBSCRIBE_KEY=$PUBNUB_SUBSCRIBE
	export CS_API_PUBNUB_SECRET=$PUBNUB_SECRET
else
	echo "**************************************************************"
	echo "WARNING: pubnub key files not found. Run dt-update-secrets and"
	echo "         reload your sandbox"
	echo "**************************************************************"
fi

# =============== SendGrid Settings ==============
[ -z "$SENDGRID_CREDENTIALS_FILE" ] && SENDGRID_CREDENTIALS_FILE=$HOME/.codestream/sendgrid/development
if [ -f $SENDGRID_CREDENTIALS_FILE ]; then
	. $SENDGRID_CREDENTIALS_FILE
	export CS_API_SENDGRID_SECRET="$SENDGRID_SECRET"
else
	echo "Warning: using old default sendgrid pkt4 secret"
	export CS_API_SENDGRID_SECRET="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"
fi

# =============== MixPanel Settings ==============
[ -z "$MIXPANEL_TOKEN_FILE" ] && MIXPANEL_TOKEN_FILE=$HOME/.codestream/mixpanel/development
if [ -f $MIXPANEL_TOKEN_FILE ]; then
	. $MIXPANEL_TOKEN_FILE
	export CS_API_MIXPANEL_TOKEN=$MIXPANEL_TOKEN
else
	echo "Warning: using old mixpanel development token"
	export CS_API_MIXPANEL_TOKEN=4308967c7435e61d9697ce240bc68d02
fi

# ============ Testing Settings ==============
# Location of the TestRepo repo used For maintaining test scripts
export CS_API_TEST_REPO_PATH=$CS_API_SANDBOX/TestRepo

# Set if this sandbox is for test-only client (no api service)
#export CS_API_TEST_ONLY=true


# =================== SQS ====================
export CS_API_OUTBOUND_EMAIL_SQS="dev_${DT_USER}_outboundEmail"
# Set the interval (in ms) between emails being sent
export CS_API_EMAIL_NOTIFICATION_INTERVAL=300000


# =============== Other Secrets ===============
[ -z "$OTHER_SECRETS_FILE" ] && OTHER_SECRETS_FILE=$HOME/.codestream/codestream-services/dev-api
if [ -f $OTHER_SECRETS_FILE ]; then
	. $OTHER_SECRETS_FILE
	export CS_API_AUTH_SECRET="$AUTH_SECRET"
	export CS_API_INBOUND_EMAIL_SECRET="$INBOUND_EMAIL_SECRET"
else
	echo "secrets file ($OTHER_SECRETS_FILE) not found. Falling back to old defaults."
	echo "Run 'dt-update-secrets' to fix this"
	export CS_API_AUTH_SECRET="A*y8lN^erPHf$"
	# Requests to the API server fromm the inbound email server provide this secret
	# This prevents outside clients from simulating inbound emails
	export CS_API_INBOUND_EMAIL_SECRET="X02^faO*Bx+lQ9Q"
fi

# ============ Email Settings ================
# Emails by default are not sent ... set this to "on" to send emails normally
# (as in production, and exercise extreme caution when testing) ...
# or set to a valid email to have all emails diverted to the specified address,
# this is good and risk-free for developer testing
[ -n "$DT_USER" ] && export CS_API_EMAIL_TO=$DT_USER@codestream.com

# By default we require email confirmation, but for developer convenience
# during testing, the requirement of email confirmation can be turned off
# To turn off the email confirmation requrement, set the below to "1"
#export CS_API_CONFIRMATION_NOT_REQUIRED=

# Domain to use when setting a reply-to for outgoing emails
# This is used when sending email notifications, we want replies to come back
# to us and for the stream where the original post originated to be identified
# in the reply-to address
export CS_API_REPLY_TO_DOMAIN=dev.codestream.com

# Emails sent from CodeStream will be sent using this address
export CS_API_SENDER_EMAIL=alerts@codestream.com
