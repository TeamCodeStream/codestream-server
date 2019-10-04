
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_BROADCASTER_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_BROADCASTER_NODE_VER" ] && export CS_BROADCASTER_NODE_VER=10.15.3
export PATH=$CS_BROADCASTER_SANDBOX/node/bin:$CS_BROADCASTER_TOP/node_modules/.bin:$PATH

export PATH=$CS_BROADCASTER_TOP/bin:$PATH

# find the config file
sandutil_get_codestream_cfg_file "$CS_BROADCASTER_SANDBOX" "$CS_BROADCASTER_CFG_FILE"

# These variables are used by shell scripts
export CS_BROADCASTER_LOGS=$(get-json-property -j $CSSVC_CFG_FILE -p broadcastEngine.codestreamBroadcaster.logger.directory)
export CS_BROADCASTER_ASSET_ENV=$(get-json-property -j $CSSVC_CFG_FILE -p broadcastEngine.codestreamBroadcaster.assetEnvironment)
export CS_BROADCASTER_ENV=$(get-json-property -j $CSSVC_CFG_FILE -p broadcastEngine.codestreamBroadcaster.runTimeEnvironment)
