
# Create default variable settings in this file

# Set by development tools
# CS_API_NAME     Name of the sandbox
# CS_API_SANDBOX  /path/to/root/of/sandbox
# CS_API_TOP      /path/to/root/of/primary/git/project

# ========== Optional override settings ==========
if [ -f "$CS_API_SANDBOX/sb.options" ]; then
	echo "Loading extra params from sb.options"
	. $CS_API_SANDBOX/sb.options
	export `grep ^CS_API_ $CS_API_SANDBOX/sb.options|cut -f1 -d=`
fi

# =============== Core Settings =================

# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
#export CS_API_YARN=true
#export CS_API_YARN_VER=1.3.2

# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_API_NODE_VER=8.11.3
export PATH=$CS_API_SANDBOX/node/bin:$CS_API_SANDBOX/yarn/bin:$CS_API_TOP/bin:$CS_API_TOP/node_modules/.bin:$PATH

# Set this variable if you require additional options when doing npm installs
# (run from sandbox/configure-sandbox).  For example, doing npm installs from
# inside a docker container requires --unsafe-perm
# export CS_API_NPM_INSTALL_XTRA_OPTS=
[ -z "$CS_API_NODE_MODULES_DIR" ] && export CS_API_NODE_MODULES_DIR=$CS_API_TOP/node_modules

export CS_API_LOGS=$CS_API_SANDBOX/log    # Log directory
export CS_API_LOG_DIRECTORY=$CS_API_SANDBOX/log
export CS_API_TMP=$CS_API_SANDBOX/tmp     # temp directory
export CS_API_CONFS=$CS_API_SANDBOX/conf  # config files directory
export CS_API_DATA=$CS_API_SANDBOX/data   # data directory
export CS_API_PIDS=$CS_API_SANDBOX/pid    # pid files directory

# Port the API server will run on
[ -z "$CS_API_PORT" ] && export CS_API_PORT=12079

# This defines the runtime environment (local, pd, qa, prod, etc...)
[ -z "$CS_API_ENV" ] && export CS_API_ENV=local

# Publicly accessible url for accessing the API service
[ -z "$CS_API_PUBLIC_URL" ] && export CS_API_PUBLIC_URL=https://localhost.codestream.us:$CS_API_PORT

# For consutrction of a callback URL used in authentication
[ -z "$CS_API_AUTH_ORIGIN" ] && export CS_API_AUTH_ORIGIN=https://auth.codestream.us/no-auth
if [ "$CS_API_ENV" == local  -a  -z "$CS_API_CALLBACK_ENV" ]; then
	if [ "$DT_OS_TYPE" == osx ]; then
		TUNNEL_IP=`netstat -rn|grep '^10\.99'|grep -v '/'|awk '{print $1}'|sed -e 's/\./-/g'`
	elif [ -n "$DT_FALLBACK_TUNNEL_IP" ]; then
		TUNNEL_IP="$DT_FALLBACK_TUNNEL_IP"
	fi
	if [ -z "$TUNNEL_IP" ]; then
		echo "I cannot detect your VPN IP so oauth callbacks will not work to your local machine"
	else
		export CS_API_CALLBACK_ENV="local-$TUNNEL_IP"
	fi
elif [ -z "$CS_API_CALLBACK_ENV" ]; then
	export CS_API_CALLBACK_ENV=$CS_API_ENV
fi

# Pointer to the codestream marketing site
[ -z "$CS_API_MARKETING_SITE_URL" ] && export CS_API_MARKETING_SITE_URL=https://teamcodestream.webflow.io

# This defines the asset environment (local, dev or prod)
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=local

# Allow console logging?
export CS_API_LOG_CONSOLE_OK=1

# Enable help
export CS_API_HELP_AVAILABLE=1


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
[ -n "$CS_API_MONGO_DATABASE" ] && export CS_API_MONGO_DATABASE=codestream
# Construct the mongo URL (needed if authentication is used)
if [ -n "$CS_API_MONGO_USER" -a -z "$CS_API_MONGO_URL" ]; then
	export CS_API_MONGO_URL="mongodb://$CS_API_MONGO_USER:$CS_API_MONGO_PASS@$CS_API_MONGO_HOST:$CS_API_MONGO_PORT/$CS_API_MONGO_DATABASE"
fi

# Define these if you want the mdb-mongo CLI to access the database
# using the system account above (as opposed to 'root')
# export MDB_CLI_USER=$CS_API_MONGO_USER
# export MDB_CLI_PASS=$CS_API_MONGO_PASS

# Tell the API service init script to setup mongo when it's started for the
# first time. This includes creating the database owner in mongo and creating
# the indexes
export CS_API_SETUP_MONGO=true


# ================= Slack API Access ==================
[ -z "$SLACK_API_ACCESS_FILE" ] && SLACK_API_ACCESS_FILE=$HOME/.codestream/slack/development
if [ -f $SLACK_API_ACCESS_FILE ]; then
	. $SLACK_API_ACCESS_FILE
	export CS_API_SLACK_CLIENT_ID="$SLACK_CLIENT_ID"
	export CS_API_SLACK_CLIENT_SECRET="$SLACK_CLIENT_SECRET"
else
	echo "********************************************************************"
	echo "WARNING: slack api access file not found ($SLACK_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= Trello API Access ==============
[ -z "$TRELLO_API_ACCESS_FILE" ] && TRELLO_API_ACCESS_FILE=$HOME/.codestream/trello/codestreamops
if [ -f $TRELLO_API_ACCESS_FILE ]; then
	. $TRELLO_API_ACCESS_FILE
	export CS_API_TRELLO_API_KEY="$TRELLO_API_KEY"
else
	echo "********************************************************************"
	echo "WARNING: trello api access file not found ($TRELLO_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= GitHub API Access ==============
[ -z "$GITHUB_API_ACCESS_FILE" ] && GITHUB_API_ACCESS_FILE=$HOME/.codestream/github/development
if [ -f $GITHUB_API_ACCESS_FILE ]; then
	. $GITHUB_API_ACCESS_FILE
	export CS_API_GITHUB_CLIENT_ID="$GITHUB_CLIENT_ID"
	export CS_API_GITHUB_CLIENT_SECRET="$GITHUB_CLIENT_SECRET"
	#export CS_API_GITHUB_ENTERPRISE_CLIENT_ID="github_enterprise_placeholder_client_id"
	#export CS_API_GITHUB_ENTERPRISE_CLIENT_SECRET="github_enterprise_placeholder_client_secret"
else
	echo "********************************************************************"
	echo "WARNING: GitHub api access file not found ($GITHUB_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= Asana API Access ==============
[ -z "$ASANA_API_ACCESS_FILE" ] && ASANA_API_ACCESS_FILE=$HOME/.codestream/asana/development
if [ -f $ASANA_API_ACCESS_FILE ]; then
	. $ASANA_API_ACCESS_FILE
	export CS_API_ASANA_CLIENT_ID="$ASANA_CLIENT_ID"
	export CS_API_ASANA_CLIENT_SECRET="$ASANA_CLIENT_SECRET"
else
	echo "********************************************************************"
	echo "WARNING: Asana api access file not found ($ASANA_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= Atlassian API Access ==============
[ -z "$ATLASSIAN_API_ACCESS_FILE" ] && ATLASSIAN_API_ACCESS_FILE=$HOME/.codestream/atlassian/development
if [ -f $ATLASSIAN_API_ACCESS_FILE ]; then
	. $ATLASSIAN_API_ACCESS_FILE
	export CS_API_JIRA_CLIENT_ID="$JIRA_CLIENT_ID"
	export CS_API_JIRA_SECRET="$JIRA_SECRET"
	export CS_API_JIRA_AUTH_CODE_GEN_TEMPLATE="$JIRA_AUTH_URL_TEMPLATE"
else
	echo "********************************************************************"
	echo "WARNING: atlassian api access file not found ($ATLASSIAN_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= GitLab API Access ==============
[ -z "$GITLAB_API_ACCESS_FILE" ] && GITLAB_API_ACCESS_FILE=$HOME/.codestream/gitlab/development
if [ -f $GITLAB_API_ACCESS_FILE ]; then
	. $GITLAB_API_ACCESS_FILE
	export CS_API_GITLAB_CLIENT_ID="$GITLAB_APP_ID"
	export CS_API_GITLAB_CLIENT_SECRET="$GITLAB_SECRET"
else
	echo "********************************************************************"
	echo "WARNING: GitLab api access file not found ($GITLAB_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= BitBucket API Access ==============4
[ -z "$BITBUCKET_API_ACCESS_FILE" ] && BITBUCKET_API_ACCESS_FILE=$HOME/.codestream/bitbucket/development
if [ -f $BITBUCKET_API_ACCESS_FILE ]; then
	. $BITBUCKET_API_ACCESS_FILE
	export CS_API_BITBUCKET_CLIENT_ID="$BITBUCKET_KEY"
	export CS_API_BITBUCKET_CLIENT_SECRET="$BITBUCKET_SECRET"
else
	echo "********************************************************************"
	echo "WARNING: BitBucket api access file not found ($BITBUCKET_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= YouTrack API Access ==============
#[ -z "$YOUTRACK_API_ACCESS_FILE" ] && YOUTRACK_API_ACCESS_FILE=$HOME/.codestream/youtrack/codestreamops
#if [ -f $YOUTRACK_API_ACCESS_FILE ]; then
#	. $YOUTRACK_API_ACCESS_FILE
#	export CS_API_YOUTRACK_CLIENT_ID="$YOUTRACK_CLIENT_ID"
#else
#	echo "********************************************************************"
#	echo "WARNING: YouTrack api access file not found ($YOUTRACK_API_ACCESS_FILE)."
#	echo "         Run dt-update-secrets and reload your sandbox"
#	echo "********************************************************************"
#fi


# ================= Azure DevOps API Access ==============
[ -z "$AZUREDEVOPS_API_ACCESS_FILE" ] && AZUREDEVOPS_API_ACCESS_FILE=$HOME/.codestream/microsoft/devops-development
if [ -f $AZUREDEVOPS_API_ACCESS_FILE ]; then
	. $AZUREDEVOPS_API_ACCESS_FILE
	export CS_API_AZUREDEVOPS_CLIENT_ID="$AZUREDEVOPS_CLIENT_ID"
	export CS_API_AZUREDEVOPS_CLIENT_SECRET="$AZUREDEVOPS_CLIENT_SECRET"
else
	echo "********************************************************************"
	echo "WARNING: Azure DevOps api access file not found ($AZUREDEVOPS_API_ACCESS_FILE)."
	echo "         Run dt-update-secrets and reload your sandbox"
	echo "********************************************************************"
fi


# ================= MSTeams API Access ==============4
export CS_API_MSTEAMS_CLIENT_ID="placeholder"
export CS_API_MSTEAMS_CLIENT_SECRET="placeholder"
#[ -z "$MSTEAMS_API_ACCESS_FILE" ] && MSTEAMS_API_ACCESS_FILE=$HOME/.codestream/msteams/development
#if [ -f $MSTEAMS_API_ACCESS_FILE ]; then
#	. $MSTEAMS_API_ACCESS_FILE
#	export CS_API_MSTEAMS_CLIENT_ID="$BITBUCKET_KEY"
#	export CS_API_MSTEAMS_CLIENT_SECRET="$BITBUCKET_SECRET"
#else
#	echo "********************************************************************"
#	echo "WARNING: MSTeams api access file not found ($MSTEAMS_API_ACCESS_FILE)."
#	echo "         Run dt-update-secrets and reload your sandbox"
#	echo "********************************************************************"
#fi


# ================= Glip API Access ==============4
export CS_API_GLIP_CLIENT_ID="placeholder"
export CS_API_GLIP_CLIENT_SECRET="placeholder"
#[ -z "$GLIP_API_ACCESS_FILE" ] && GLIP_API_ACCESS_FILE=$HOME/.codestream/glip/development
#if [ -f $GLIP_API_ACCESS_FILE ]; then
#	. $GLIP_API_ACCESS_FILE
#	export CS_API_GLIP_CLIENT_ID="$BITBUCKET_KEY"
#	export CS_API_GLIP_CLIENT_SECRET="$BITBUCKET_SECRET"
#else
#	echo "********************************************************************"
#	echo "WARNING: Glip api access file not found ($GLIP_API_ACCESS_FILE)."
#	echo "         Run dt-update-secrets and reload your sandbox"
#	echo "********************************************************************"
#fi


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
	echo "WARNING: pubnub key files not found ($PUBNUB_KEY_FILE)."
	echo "          Run dt-update-secrets and reload your sandbox"
	echo "**************************************************************"
fi

# =============== MixPanel Settings ==============
[ -z "$MIXPANEL_TOKEN_FILE" ] && MIXPANEL_TOKEN_FILE=$HOME/.codestream/mixpanel/development
if [ -f $MIXPANEL_TOKEN_FILE ]; then
	. $MIXPANEL_TOKEN_FILE
	export CS_API_MIXPANEL_TOKEN=$MIXPANEL_TOKEN
else
	echo "**************************************************************"
	echo "WARNING: MixPanel token file ($MIXPANEL_TOKEN_FILE) not found"
	echo "**************************************************************"
fi


# =============== Segment Settings ==============
[ -z "$SEGMENT_TOKEN_FILE" ] && SEGMENT_TOKEN_FILE=$HOME/.codestream/segment/dev-api
if [ -f $SEGMENT_TOKEN_FILE ]; then
	. $SEGMENT_TOKEN_FILE
	export CS_API_SEGMENT_TOKEN=$SEGMENT_TOKEN
else
	echo "**************************************************************"
	echo "WARNING: Segment token not found ($SEGMENT_TOKEN_FILE). Server-side telemetry will be unavailable."
	echo "**************************************************************"
fi
[ -z "$SEGMENT_WEB_TOKEN_FILE" ] && SEGMENT_WEB_TOKEN_FILE=$HOME/.codestream/segment/dev-webapp
if [ -f $SEGMENT_WEB_TOKEN_FILE ]; then
	. $SEGMENT_WEB_TOKEN_FILE
	export CS_API_SEGMENT_WEB_TOKEN=$SEGMENT_TOKEN
else
	echo "**************************************************************"
	echo "WARNING: Segment web token not found ($SEGMENT_WEB_TOKEN_FILE). Server-side telemetry will be unavailable."
	echo "**************************************************************"
fi


# =============== Other Secrets ===============
[ -z "$OTHER_SECRETS_FILE" ] && OTHER_SECRETS_FILE=$HOME/.codestream/codestream/local-api
if [ -f $OTHER_SECRETS_FILE ]; then
	. $OTHER_SECRETS_FILE
	export CS_API_AUTH_SECRET="$AUTH_SECRET"
	# Requests to the API server fromm the inbound email server provide this secret
	# This prevents outside clients from simulating inbound emails
	export CS_API_INBOUND_EMAIL_SECRET="$INBOUND_EMAIL_SECRET"
	# for bypassing email confirmation, used for unit testing
	export CS_API_CONFIRMATION_CHEAT_CODE="$CONFIRMATION_CHEAT_CODE"
	# for allowing unregistered users to subscribe to their me-channel, for testing emails
	export CS_API_SUBSCRIPTION_CHEAT_CODE="$SUBSCRIPTION_CHEAT_CODE"
	# for accessing the api prior to authentication
	export CS_API_PRE_AUTH_SECRET="$PRE_AUTH_SECRET"
	# for permalinks
	export CS_API_COOKIE_SECRET="$COOKIE_SECRET"
else
	echo "****"
	echo "**** FATAL ERROR ****"
	echo "**** secrets file ($OTHER_SECRETS_FILE) not found. Run 'dt-update-secrets' to fix this then"
	echo "**** reload your playground / sandbox"
	echo "****"
fi


# =============== Other Services ==============
# The web-app service (for constructing links in email notifications)
[ -z "$CS_API_WEB_CLIENT_ORIGIN" ] && export CS_API_WEB_CLIENT_ORIGIN=http://localhost.codestream.us:1380


# ============ Testing Settings ==============
# Location of the TestRepo repo used For maintaining test scripts
export CS_API_TEST_REPO_PATH=$CS_API_SANDBOX/TestRepo

# Set if this sandbox is for test-only client (no api service)
# export CS_API_TEST_ONLY=true



# ============ Email Settings ================
# Outbound email events are placed on this queue. The outbound email
# server processes the queue and sends the emails (a lambda function)
export CS_API_OUTBOUND_EMAIL_SQS="${CS_API_ENV}_${DT_USER}_outboundEmail"

# Set the interval (in ms) between emails being sent
export CS_API_EMAIL_NOTIFICATION_INTERVAL=300000

# Suppress all email sends
export CS_API_SUPPRESS_EMAILS=1

# By default we require email confirmation, but for developer convenience
# during testing, the requirement of email confirmation can be turned off
# To turn off the email confirmation requrement, set the below to "1"
# export CS_API_CONFIRMATION_NOT_REQUIRED=

# Domain to use when setting a reply-to for outgoing emails
# This is used when sending email notifications, we want replies to come back
# to us and for the stream where the original post originated to be identified
# in the reply-to address
export CS_API_REPLY_TO_DOMAIN=${CS_API_ENV}.codestream.com

# Emails sent from CodeStream will be sent using this address
export CS_API_SENDER_EMAIL=alerts@codestream.com
