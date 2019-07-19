
. $DT_TOP/lib/sandbox_utils.sh
. $CS_API_TOP/sandbox/lib/sbutils.sh

sandutil_load_options $CS_API_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_API_NODE_VER" ] && export CS_API_NODE_VER=10.15.3
export PATH=$CS_API_SANDBOX/node/bin:$CS_API_TOP/node_modules/.bin:$PATH

export PATH=$CS_API_TOP/bin:$PATH

[ -z "$CSSVC_CFG_FILE" -a -z "$CS_API_CFG_FILE" ] && export CS_API_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
[ -n "$CSSVC_CFG_FILE" ] && cfgFile=$CSSVC_CFG_FILE || cfgFile=$CS_API_CFG_FILE
echo "Using config file $cfgFile"

# env vars required for scripts that don't load the config file
export CS_API_LOGS=`eval echo $(get-json-property -j $cfgFile -p apiServer.logger.directory)`
export CS_API_TMP=`eval echo $(get-json-property -j $cfgFile -p apiServer.tmpDirectory)`
export CS_API_ASSET_ENV=`eval echo $(get-json-property -j $cfgFile -p apiServer.assetEnvironment)`
export CS_API_ENV=`eval echo $(get-json-property -j $cfgFile -p apiServer.runTimeEnvironment)`

# this sets CS_API_CALLBACK_ENV
set_callback_env
