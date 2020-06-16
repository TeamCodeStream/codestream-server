
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_OUTBOUND_EMAIL_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_OUTBOUND_EMAIL_NODE_VER" ] && export CS_OUTBOUND_EMAIL_NODE_VER=12.14.1
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH

# sandbox bin directory is at front of search path
export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

export NODE_PATH=$CS_OUTBOUND_EMAIL_TOP/node_modules:$NODE_PATH

[ -n "$CSSVC_ENV" ] && export CS_OUTBOUND_EMAIL_ENV=$CSSVC_ENV
[ -n "$CS_OUTBOUND_EMAIL_CFG_FILE" ] && configParm=$CS_OUTBOUND_EMAIL_CFG_FILE || configParm="$CSSVC_CONFIGURATION"
[ -z "$CSSVC_CFG_FILE" ] && sandutil_get_codestream_cfg_file "$CS_OUTBOUND_EMAIL_SANDBOX" "$configParm" "$CSSVC_ENV"
[ -n "$CS_OUTBOUND_EMAIL_CFG_FILE" -a \( "$CSSVC_CFG_FILE" != "$CS_OUTBOUND_EMAIL_CFG_FILE" \) ] && echo "**** WARNING: CS_OUTBOUND_EMAIL_CFG_FILE != CSSVC_CFG_FILE"

# env vars required for scripts that don't load the config file
[ -z "$CS_OUTBOUND_EMAIL_ENV" ] && export CS_OUTBOUND_EMAIL_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p sharedGeneral.runTimeEnvironment)`
export CS_OUTBOUND_EMAIL_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.logger.directory)`
export CS_OUTBOUND_EMAIL_TMP=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.tmpDirectory)`
export CS_OUTBOUND_EMAIL_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.assetEnvironment)`
export CS_OUTBOUND_EMAIL_SQS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p queuingEngine.awsSQS.outboundEmailQueueName  2>/dev/null)`

# Multiple installations - mono-repo and individual - have the same repo root ($REPO_ROOT/.git/)
. $CS_OUTBOUND_EMAIL_SANDBOX/sb.info
[ -n "$SB_REPO_ROOT" ] && export CS_OUTBOUND_EMAIL_REPO_ROOT=$CS_OUTBOUND_EMAIL_SANDBOX/$SB_REPO_ROOT || export CS_OUTBOUND_EMAIL_REPO_ROOT=$CS_OUTBOUND_EMAIL_TOP
[ -z "$CSSVC_BACKEND_ROOT" ] && export CSSVC_BACKEND_ROOT=$CS_OUTBOUND_EMAIL_REPO_ROOT
