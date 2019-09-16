
. $DT_TOP/lib/sandbox_utils.sh
. $CS_API_TOP/sandbox/lib/sbutils.sh

sandutil_load_options $CS_API_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_API_NODE_VER" ] && export CS_API_NODE_VER=10.15.3
export PATH=$CS_API_SANDBOX/node/bin:$CS_API_TOP/node_modules/.bin:$PATH

export PATH=$CS_API_TOP/bin:$PATH

# this sets CSSVC_CFG_FILE
sandutil_get_codestream_cfg_file $CS_API_CFG_FILE

# env vars required for aux scripts that don't load the config file
export CS_API_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.logger.directory)`
export CS_API_TMP=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.tmpDirectory)`
export CS_API_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.assetEnvironment)`
export CS_API_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.runTimeEnvironment)`

# this sets CS_API_CALLBACK_ENV
set_callback_env
