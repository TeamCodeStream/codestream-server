
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  CSBE_NAME     Name of the installed sandbox (installation specific)
#  CSBE_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is CSBE_TOP/sandbox/defaults.sh)
#  CSBE_SANDBOX  Path to the root directory of the sandbox tree

# this shell library contains shell functions for manipulating sandboxes
. $DT_TOP/lib/sandbox_utils.sh || { echo "error loading library $DT_TOP/lib/sandbox_utils.sh" >&2 && return 1; }


# Installation options
# --------------------
# You can override a sandbox's configuration variables by placing
# 'VARIABLE=VALUE' assignments into $MY_SANDBOX/sb.options.  These
# settings will override any others specified in the sandbox config.
# Each row is stricly a KEY=VALUE assignment. Do not write shell
# code. Use a hash (#) for comments.
sandutil_load_options $CSBE_SANDBOX || { echo "failed to load options" >&2 && return 1; }


# ------------- Yarn --------------
# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
# export CSBE_YARN=true
# export CSBE_YARN_VER=latest
# export PATH=$CSBE_SANDBOX/yarn/bin:$PATH


# ------------- Node --------------
# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CSBE_NODE_VER=12.14.1
export PATH=$CSBE_SANDBOX/node/bin:$CSBE_TOP/node_modules/.bin:./node_modules/.bin:$PATH

# Add $MY_SANDBOX/bin to the search path
export PATH=$CSBE_TOP/bin:$PATH

# if you want to short circuit the sandbox hooks (see hooks/git_hooks.sh) either uncomment
# this in defaults.sh or add 'CSBE_DISABLE_GIT_HOOKS=1' to CSBE_SANDBOX/sb.options
# export CSBE_DISABLE_GIT_HOOKS=1

# Standard variables for all sandboxes - USE THESE TO INTEGRATE WITH OPS!!!
export CSBE_LOGS=$CSBE_SANDBOX/log    # Log directory
export CSBE_TMP=$CSBE_SANDBOX/tmp     # temp directory
export CSBE_CONFS=$CSBE_SANDBOX/conf  # config files directory
export CSBE_DATA=$CSBE_SANDBOX/data   # data directory
export CSBE_PIDS=$CSBE_SANDBOX/pid    # pid files directory

# The asset/artifact build environment; usually 'local', 'dev' or 'prod'
# https://github.com/TeamCodeStream/dev_tools/blob/master/README/README.deployments.md)
[ -z "$CSBE_ASSET_ENV" ] && export CSBE_ASSET_ENV=local

# The sandbox run-time environment;  eg. 'local', 'qa', 'prod', 'loadtest1', ...
# https://github.com/TeamCodeStream/dev_tools/blob/master/README/README.deployments.md)
[ -z "$CSBE_ENV" ] && export CSBE_ENV=local

export CSSVC_BACKEND_ROOT=$CSBE_TOP

# These variables are defined by the sandbox-env-loader.sh script which won't be
# called for the individual services
echo "Loading api environment..."
export CS_API_NAME=$CSBE_NAME
export CS_API_SANDBOX=$CSBE_SANDBOX
export CS_API_TOP=$CSBE_TOP/api_server
# CS_API_DEPS=....
. $CS_API_TOP/sandbox/defaults.sh

echo "Loading broadcaster environment..."
export CS_BROADCASTER_NAME=$CSBE_NAME
export CS_BROADCASTER_SANDBOX=$CSBE_SANDBOX
export CS_BROADCASTER_TOP=$CSBE_TOP/broadcaster
# CS_BROADCASTER_DEPS=....
. $CS_BROADCASTER_TOP/sandbox/defaults.sh

echo "Loading mailin environment..."
export CS_MAILIN_NAME=$CSBE_NAME
export CS_MAILIN_SANDBOX=$CSBE_SANDBOX
export CS_MAILIN_TOP=$CSBE_TOP/inbound_email
# CS_MAILIN_DEPS=....
. $CS_MAILIN_TOP/sandbox/defaults.sh

echo "Loading mailout environment..."
export CS_OUTBOUND_EMAIL_NAME=$CSBE_NAME
export CS_OUTBOUND_EMAIL_SANDBOX=$CSBE_SANDBOX
export CS_OUTBOUND_EMAIL_TOP=$CSBE_TOP/outbound_email
# CS_OUTBOUND_EMAIL_DEPS=....
. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh

echo "Loading onprem-admin environment..."
export OPADM_NAME=$CSBE_NAME
export OPADM_SANDBOX=$CSBE_SANDBOX
export OPADM_TOP=$CSBE_TOP/onprem_admin
# OPADM_DEPS=....
. $OPADM_TOP/sandbox/defaults.sh
