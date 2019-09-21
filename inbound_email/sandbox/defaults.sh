
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  CS_MAILIN_NAME     Name of the installed sandbox (installation specific)
#  CS_MAILIN_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is CS_MAILIN_TOP/sandbox/defaults.sh)
#  CS_MAILIN_SANDBOX  Path to the root directory of the sandbox tree

. $DT_TOP/lib/sandbox_utils.sh

# ========== Optional override settings ==========
sandutil_load_options $CS_MAILIN_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
#export CS_MAILIN_YARN=true
#export CS_MAILIN_YARN_VER=1.3.2
#export PATH=$CS_MAILIN_SANDBOX/yarn/bin:$PATH

# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_MAILIN_NODE_VER=10.15.3
export PATH=$CS_MAILIN_SANDBOX/node/bin:$CS_MAILIN_TOP/node_modules/.bin:$PATH
#
# Set this variable if you require additional options when doing npm installs
# (run from sandbox/configure-sandbox).  For example, doing npm installs from
# inside a docker container requires --unsafe-perm
#
# export CS_MAILIN_NPM_INSTALL_XTRA_OPTS=

# Add sandbox utilities to the search path
export PATH=$CS_MAILIN_TOP/bin:$PATH

# Standard variables to consider using
export CS_MAILIN_LOGS=$CS_MAILIN_SANDBOX/log    # Log directory
export CS_MAILIN_TMP=$CS_MAILIN_SANDBOX/tmp     # temp directory
export CS_MAILIN_CONFS=$CS_MAILIN_SANDBOX/conf  # config files directory
export CS_MAILIN_DATA=$CS_MAILIN_SANDBOX/data   # data directory
export CS_MAILIN_PIDS=$CS_MAILIN_SANDBOX/pid    # pid files directory

[ -z "$CS_MAILIN_ASSET_ENV" ] && export CS_MAILIN_ASSET_ENV=local

# This defines the runtime environment (local, pd, qa, prod, etc...)
[ -z "$CS_MAILIN_ENV" ] && export CS_MAILIN_ENV=local

# Inbound mail queue directories
export CS_MAILIN_MAILQ_TOP=$CS_MAILIN_SANDBOX/mailq
# new email files will be delivered to this directory
export CS_MAILIN_DIRECTORY=$CS_MAILIN_MAILQ_TOP/new
# email files will be moved to this directory for processing
export CS_MAILIN_PROCESS_DIRECTORY=$CS_MAILIN_MAILQ_TOP/process
# attachments in incoming emails will be stored temporarily here
export CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY=$CS_MAILIN_MAILQ_TOP/attachments


# host and port of the API server (a fully qualified name is required for HTTPS)
[ -z "$CS_MAILIN_API_HOST" ] && export CS_MAILIN_API_HOST=localhost.codestream.us
[ -z "$CS_MAILIN_API_PORT" ] && export CS_MAILIN_API_PORT=12079


# Secret code needed to communicate with API server (match CS_API_INBOUND_EMAIL_SECRET)
[ -z "$MAIL_SECRETS_FILE" ] && MAIL_SECRETS_FILE=$HOME/.codestream/codestream/dev-api
if [ -f "$MAIL_SECRETS_FILE" ]; then
	. $MAIL_SECRETS_FILE
	export CS_MAILIN_SECRET=$INBOUND_EMAIL_SECRET
	export CS_MAILIN_CONFIRMATION_CHEAT_CODE="$CONFIRMATION_CHEAT_CODE"
else
	echo "*************************************************************"
	echo "$MAIL_SECRETS_FILE not found."
	echo "Please run dt-update-secrets to get the latest values."
	echo "*************************************************************"
fi


# =============== PubNub Settings ==============
# see README.pubnub for more details - Pubnub needed for unit tests only
[ -z "$PUBNUB_KEY_FILE" ] && PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-Local_Keyset_1"
if [ -f $PUBNUB_KEY_FILE ]; then
	. $PUBNUB_KEY_FILE
    export CS_MAILIN_PUBNUB_SUBSCRIBE_KEY=$PUBNUB_SUBSCRIBE
else
	echo "**************************************************************"
	echo "WARNING: pubnub key files not found. Run dt-update-secrets and"
	echo "         reload your sandbox"
	echo "**************************************************************"
fi


# domain we use in the reply-to field of outbound emails_sent (match CS_API_REPLY_TO_DOMAIN)
export CS_MAILIN_REPLY_TO_DOMAIN=local.codestream.com

# address we send outbound emails from (match CS_API_SENDER_EMAIL)
export CS_MAILIN_SENDER_EMAIL=alerts@codestream.com

# output to console when running inbound email server
#export CS_MAILIN_LOG_CONSOLE_OK=1

# For the local poller service (cs_mailin-local-poller)
# Remote Inbound mail server name and directory
export CS_MAILIN_REMOTE_INBOUND_MAIL_SERVER=web@localmail.codestream.us
export CS_MAILIN_REMOTE_INBOUND_MAIL_DIR=/home/web/codestream-mail/inbound/web/new
