
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  CS_BROADCASTER_NAME     Name of the installed sandbox (installation specific)
#  CS_BROADCASTER_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is CS_BROADCASTER_TOP/sandbox/defaults.sh)
#  CS_BROADCASTER_SANDBOX  Path to the root directory of the sandbox tree


# Installation options
# --------------------
# You can override a sandbox's configuration variables by placing
# 'VARIABLE=VALUE' assignments into $MY_SANDBOX/sb.options.  These
# settings will override any others specified in the sandbox config.
# Each row is stricly a KEY=VALUE assignment. Do not write shell
# code. Use a ash (#) for comments.

if [ -f "$CS_BROADCASTER_SANDBOX/sb.options" ]; then
	echo "Loading extra params from sb.options"
	. $CS_BROADCASTER_SANDBOX/sb.options
	export `grep ^CS_BROADCASTER_ $CS_BROADCASTER_SANDBOX/sb.options|cut -f1 -d=`
fi


# ------------- Yarn --------------
# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
# export CS_BROADCASTER_YARN=true
# export CS_BROADCASTER_YARN_VER=latest
# export PATH=$CS_BROADCASTER_SANDBOX/yarn/bin:$PATH


# ------------- Node --------------
# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_BROADCASTER_NODE_VER=10.15.3
export PATH=$CS_BROADCASTER_SANDBOX/node/bin:$CS_BROADCASTER_TOP/node_modules/.bin:$PATH
#
#
# Set this variable if you require additional options when doing npm installs
# (run from sandbox/configure-sandbox).  For example, doing npm installs from
# inside a docker container requires --unsafe-perm
#
# export CS_BROADCASTER_NPM_INSTALL_XTRA_OPTS=

# Add $MY_SANDBOX/bin to the search path
export PATH=$CS_BROADCASTER_TOP/bin:$PATH

# Uncomment if you want to short circuit the sandbox hooks (see hooks/git_hooks.sh).
# Similar to running 'git commit --no-verify'
# export CS_BROADCASTER_DISABLE_GIT_HOOKS=1

# Standard locations inside the sandbox
export CS_BROADCASTER_LOGS=$CS_BROADCASTER_SANDBOX/log    # Log directory
export CS_BROADCASTER_TMP=$CS_BROADCASTER_SANDBOX/tmp     # temp directory
export CS_BROADCASTER_CONFS=$CS_BROADCASTER_SANDBOX/conf  # config files directory
export CS_BROADCASTER_DATA=$CS_BROADCASTER_SANDBOX/data   # data directory
export CS_BROADCASTER_PIDS=$CS_BROADCASTER_SANDBOX/pid    # pid files directory

# Defines the asset build environment (usually 'local', 'dev' or 'prod')
# Used mostly when building assets or creating config files
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && export CS_BROADCASTER_ASSET_ENV=local

# Defines the run-time environment (usually 'local', 'qa', 'pd', 'prod')
# Used for configuring a sandbox for a specific environment at run-time.
[ -z "$CS_BROADCASTER_ENV" ] && export CS_BROADCASTER_ENV=local

# Console logging - undefine for non-local environments
[ -z "$CS_BROADCASTER_LOG_CONSOLE_OK" ] && export CS_BROADCASTER_LOG_CONSOLE_OK=1

# Port
[ -z "$CS_BROADCASTER_PORT" ] && export CS_BROADCASTER_PORT=12443

# Secrets
# =============== Other Secrets ===============
[ -z "$OTHER_SECRETS_FILE" ] && OTHER_SECRETS_FILE=$HOME/.codestream/codestream/local-api
if [ -f $OTHER_SECRETS_FILE ]; then
	. $OTHER_SECRETS_FILE
	# export CS_API_AUTH_SECRET="$AUTH_SECRET"
	# used to privilege certain api server requests to the messager service
	export CS_BROADCASTER_AUTH_SECRET=""
	# used to generate json web tokens for authentication tokens passed to the client
	export CS_BROADCASTER_API_SECRET=""
	# set to the same value that CS_API_SUBSCRIPTION_CHEAT_CODE is set to for the api server
	export CS_API_SUBSCRIPTION_CHEAT_CODE="$SUBSCRIPTION_CHEAT_CODE"
else
	echo "****"
	echo "**** FATAL ERROR ****"
	echo "**** secrets file ($OTHER_SECRETS_FILE) not found. Run 'dt-update-secrets' to fix this then"
	echo "**** reload your playground / sandbox"
	echo "****"
fi

# ================ Mongo Settings ==================
[ -z "$MONGO_ACCESS_FILE" ] && MONGO_ACCESS_FILE="$HOME/.codestream/mongo/mongo-access"
if [ -f $MONGO_ACCESS_FILE ]; then
	. $MONGO_ACCESS_FILE
	[ -n "$MONGO_DB" ] && export CS_API_MONGO_DATABASE=$MONGO_DB
	[ -n "$MONGO_URL" ] && export CS_API_MONGO_URL=$MONGO_URL
	# MONGO_HOST=
	# MONGO_PORT=
	# MONGO_APP_USER=
	# MONGO_APP_PASS=
elif [ -n "$MDB_HOST" ]; then
	# Take the values from the mongo sandbox in the playground
	MONGO_HOST=$MDB_HOST
	[ -n "$MDB_PORT" ] && MONGO_PORT=$MDB_PORT
	[ -n "$MDB_USER" ] && MONGO_APP_USER=$MDB_USER
	[ -n "$MDB_PASS" ] && MONGO_APP_PASS=$MDB_PASS
else
	MONGO_HOST=localhost
fi
[ -z "$CS_API_MONGO_DATABASE" ] && export CS_API_MONGO_DATABASE=codestream
# Construct the mongo URL if need be
if [ -z "$CS_API_MONGO_URL" ]; then
	CS_API_MONGO_URL="mongodb://"
	[ -n "$MONGO_APP_PASS" ] && mongo_pass=":MONGO_APP_PASS" || mongo_pass=""
	[ -n "$MONGO_APP_USER" ] && CS_API_MONGO_URL="${CS_API_MONGO_URL}${MONGO_APP_USER}${mongo_pass}@"
	CS_API_MONGO_URL="${CS_API_MONGO_URL}$MONGO_HOST"
	[ -n "$MONGO_PORT" ] && CS_API_MONGO_URL="${CS_API_MONGO_URL}:$MONGO_PORT"
	CS_API_MONGO_URL="${CS_API_MONGO_URL}/$CS_API_MONGO_DATABASE"
	export CS_API_MONGO_URL
fi

# ============== SSL Certificate ==================
[ -z "$SSL_CERT_ROOT" ] && SSL_CERT_ROOT=$HOME/.certs
[ -z "$SSL_CERT" ] && SSL_CERT=wildcard.codestream.us
[ ! -d "$SSL_CERT_ROOT/$SSL_CERT" ] && echo "WARNING: SSL Cert dir ($SSL_CERT_ROOT/$SSL_CERT) not found"
export CS_BROADCASTER_SSL_KEYFILE="$SSL_CERT_ROOT/$SSL_CERT/${SSL_CERT}-key"
export CS_BROADCASTER_SSL_CERTFILE="$SSL_CERT_ROOT/$SSL_CERT/${SSL_CERT}-crt"
export CS_BROADCASTER_SSL_CAFILE="$SSL_CERT_ROOT/$SSL_CERT/${SSL_CERT}-ca"
