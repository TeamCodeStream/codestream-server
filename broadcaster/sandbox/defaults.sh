
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_BROADCASTER_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_BROADCASTER_NODE_VER" ] && export CS_BROADCASTER_NODE_VER=12.14.1
export PATH=$CS_BROADCASTER_SANDBOX/node/bin:$CS_BROADCASTER_TOP/node_modules/.bin:$PATH

export PATH=$CS_BROADCASTER_TOP/bin:$PATH
export NODE_PATH=$CS_BROADCASTER_TOP/node_modules:$NODE_PATH

[ -n "$CSSVC_ENV" ] && export CS_BROADCASTER_ENV=$CSSVC_ENV
[ -n "$CS_BROADCASTER_CFG_FILE" ] && configParm=$CS_BROADCASTER_CFG_FILE || configParm="$CSSVC_CONFIGURATION"

[ -z "$CSSVC_CFG_FILE" ] && sandutil_get_codestream_cfg_file "$CS_BROADCASTER_SANDBOX" "$configParm" "$CSSVC_ENV"
[ -n "$CS_BROADCASTER_CFG_FILE" -a \( "$CSSVC_CFG_FILE" != "$CS_BROADCASTER_CFG_FILE" \) ] && echo "**** WARNING: CS_BROADCASTER_CFG_FILE != CSSVC_CFG_FILE"

# These variables are used by shell scripts
export CS_BROADCASTER_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p sharedGeneral.runTimeEnvironment 2>/dev/null)`
export CS_BROADCASTER_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p broadcastEngine.codestreamBroadcaster.logger.directory 2>/dev/null)`
export CS_BROADCASTER_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p broadcastEngine.codestreamBroadcaster.assetEnvironment 2>/dev/null)`
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && echo "The config file does not support the codestream broadcaster as a broadcastEngine. This sandbox is DOA."

# Multiple installations - mono-repo and individual - have the same repo root ($REPO_ROOT/.git/)
. $CS_BROADCASTER_SANDBOX/sb.info
[ -n "$SB_REPO_ROOT" ] && export CS_BROADCASTER_REPO_ROOT=$CS_BROADCASTER_SANDBOX/$SB_REPO_ROOT || export CS_BROADCASTER_REPO_ROOT=$CS_BROADCASTER_TOP
[ -z "$CSSVC_BACKEND_ROOT" ] && export CSSVC_BACKEND_ROOT=$CS_BROADCASTER_REPO_ROOT
