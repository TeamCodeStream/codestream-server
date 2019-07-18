
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_API_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_API_NODE_VER" ] && export CS_API_NODE_VER=10.15.3
export PATH=$CS_API_SANDBOX/node/bin:$CS_API_TOP/node_modules/.bin:$PATH

export PATH=$CS_API_TOP/bin:$PATH

[ -z "$CSSVC_CFG_FILE" -a -z "$CS_API_CFG_FILE" ] && export CS_API_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
[ -n "$CSSVC_CFG_FILE" ] && cfgFile=$CSSVC_CFG_FILE || cfgFile=$CS_API_CFG_FILE
echo "Using config file $cfgFile"

# env vars required for all scripts in the sandbox to work
export CS_API_LOGS=$CS_API_SANDBOX/log    # Log directory
export CS_API_TMP=$CS_API_SANDBOX/tmp     # temp directory
export CS_API_CONFS=$CS_API_SANDBOX/conf  # config files directory
export CS_API_DATA=$CS_API_SANDBOX/data   # data directory
export CS_API_PIDS=$CS_API_SANDBOX/pid    # pid files directory

export CS_API_ASSET_ENV=$(get-json-property -j $cfgFile -p apiServer.assetEnvironment)
export CS_API_ENV=$(get-json-property -j $cfgFile -p apiServer.runTimeEnvironment)
