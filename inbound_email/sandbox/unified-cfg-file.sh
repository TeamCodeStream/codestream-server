
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_MAILIN_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_MAILIN_NODE_VER" ] && export CS_MAILIN_NODE_VER=10.15.3
export PATH=$CS_MAILIN_SANDBOX/node/bin:$CS_MAILIN_TOP/node_modules/.bin:$PATH

export PATH=$CS_MAILIN_TOP/bin:$PATH

if [ -z "$CSSVC_CFG_FILE" -a -z "$CS_MAILIN_CFG_FILE" ]; then
	export CS_MAILIN_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
elif [ -n "$CSSVC_CFG_FILE" ]; then
	export CS_MAILIN_CFG_FILE=$CSSVC_CFG_FILE
fi
echo "Using config file $CS_MAILIN_CFG_FILE"

# env vars required for aux scripts that don't load the config file
export CS_MAILIN_LOGS=`eval echo $(get-json-property -j $CS_MAILIN_CFG_FILE -p inboundEmailServer.logger.directory)`
export CS_MAILIN_TMP=`eval echo $(get-json-property -j $CS_MAILIN_CFG_FILE -p inboundEmailServer.tmpDirectory)`
export CS_MAILIN_ASSET_ENV=`eval echo $(get-json-property -j $CS_MAILIN_CFG_FILE -p inboundEmailServer.assetEnvironment)`
export CS_MAILIN_ENV=`eval echo $(get-json-property -j $CS_MAILIN_CFG_FILE -p inboundEmailServer.runTimeEnvironment)`

# For the local poller service (cs_mailin-local-poller)
export CS_MAILIN_INBOUND_MAIL_SERVER=web@localmail.codestream.us
export CS_MAILIN_INBOUND_MAIL_DIR=/home/web/codestream-mail/inbound/web/new
