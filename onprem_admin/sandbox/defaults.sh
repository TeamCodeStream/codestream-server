
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  OPADM_NAME     Name of the installed sandbox (installation specific)
#  OPADM_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is OPADM_TOP/sandbox/defaults.sh)
#  OPADM_SANDBOX  Path to the root directory of the sandbox tree

# this shell library contains shell functions for manipulating sandboxes
. $DT_TOP/lib/sandbox_utils.sh || { echo "error loading library $DT_TOP/lib/sandbox_utils.sh" >&2 && return 1; }


# Installation options
# --------------------
# You can override a sandbox's configuration variables by placing
# 'VARIABLE=VALUE' assignments into $MY_SANDBOX/sb.options.  These
# settings will override any others specified in the sandbox config.
# Each row is stricly a KEY=VALUE assignment. Do not write shell
# code. Use a hash (#) for comments.
sandutil_load_options $OPADM_SANDBOX || { echo "failed to load options" >&2 && return 1; }


# ------------- Yarn --------------
# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
# export OPADM_YARN=true
# export OPADM_YARN_VER=latest
# export PATH=$OPADM_SANDBOX/yarn/bin:$PATH


# ------------- Node --------------
# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export OPADM_NODE_VER=12.14.1
export PATH=$OPADM_SANDBOX/node/bin:$OPADM_TOP/node_modules/.bin:$PATH


# Add $MY_SANDBOX/bin to the search path
export PATH=$OPADM_TOP/bin:$PATH

# if you want to short circuit the sandbox hooks (see hooks/git_hooks.sh) either uncomment
# this in defaults.sh or add 'OPADM_DISABLE_GIT_HOOKS=1' to OPADM_SANDBOX/sb.options
# export OPADM_DISABLE_GIT_HOOKS=1

[ -n "$CSSVC_ENV" ] && export OPADM_ENV=$CSSVC_ENV
[ -n "$OPADM_CFG_FILE" ] && configParm=$OPADM_CFG_FILE || configParm="$CSSVC_CONFIGURATION"
sandutil_get_codestream_cfg_file "$OPADM_SANDBOX" "$configParm" "$CSSVC_ENV"

# Standard variables for all sandboxes - USE THESE TO INTEGRATE WITH OPS!!!
export OPADM_LOGS=$OPADM_SANDBOX/log    # Log directory
# export OPADM_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.logger.directory)`
export OPADM_TMP=$OPADM_SANDBOX/tmp     # temp directory
# export OPADM_TMP=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.tmpDirectory)`
export OPADM_CONFS=$OPADM_SANDBOX/conf  # config files directory
export OPADM_DATA=$OPADM_SANDBOX/data   # data directory
export OPADM_PIDS=$OPADM_SANDBOX/pid    # pid files directory

# The asset/artifact build environment; usually 'local', 'dev' or 'prod'
# https://github.com/TeamCodeStream/dev_tools/blob/master/README/README.deployments.md)
[ -z "$OPADM_ASSET_ENV" ] && export OPADM_ASSET_ENV=local
# export OPADM_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.assetEnvironment)`

# The sandbox run-time environment;  eg. 'local', 'qa', 'prod', 'loadtest1', ...
# https://github.com/TeamCodeStream/dev_tools/blob/master/README/README.deployments.md)
[ -z "$OPADM_ENV" ] && export OPADM_ENV=local
# [ -z "$OPADM_ENV" ] && export OPADM_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.runTimeEnvironment)`
