
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_BROADCASTER_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_BROADCASTER_NODE_VER" ] && export CS_BROADCASTER_NODE_VER=10.15.3
export PATH=$CS_BROADCASTER_SANDBOX/node/bin:$CS_BROADCASTER_TOP/node_modules/.bin:$PATH

export PATH=$CS_BROADCASTER_TOP/bin:$PATH

[ -z "$CSSVC_CFG_FILE" -a -z "$CS_BROADCASTER_CFG_FILE" ] && export CS_BROADCASTER_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
[ -n "$CSSVC_CFG_FILE" ] && cfgFile=$CSSVC_CFG_FILE || cfgFile=$CS_BROADCASTER_CFG_FILE
echo "Using config file $cfgFile"

# These variables are used by shell scripts
export CS_BROADCASTER_TMP=$CS_BROADCASTER_SANDBOX/tmp     # temp directory
export CS_BROADCASTER_CONFS=$CS_BROADCASTER_SANDBOX/conf  # config files directory
export CS_BROADCASTER_DATA=$CS_BROADCASTER_SANDBOX/data   # data directory
export CS_BROADCASTER_PIDS=$CS_BROADCASTER_SANDBOX/pid    # pid files directory
export CS_BROADCASTER_LOGS=$(get-json-property -j $cfgFile -p broadcastEngine.codestreamBroadcaster.logger.directory)
export CS_BROADCASTER_ASSET_ENV=$(get-json-property -j $cfgFile -p broadcastEngine.codestreamBroadcaster.assetEnvironment)
export CS_BROADCASTER_ENV=$(get-json-property -j $cfgFile -p broadcastEngine.codestreamBroadcaster.runTimeEnvironment)
