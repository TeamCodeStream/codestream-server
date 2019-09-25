
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_OUTBOUND_EMAIL_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_OUTBOUND_EMAIL_NODE_VER" ] && export CS_OUTBOUND_EMAIL_NODE_VER=10.15.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH

# sandbox bin directory is at front of search path
export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

# find the config file
sandutil_get_codestream_cfg_file "$CS_OUTBOUND_EMAIL_SANDBOX" "$CS_OUTBOUND_EMAIL_CFG_FILE"

# env vars required for scripts that don't load the config file
export CS_OUTBOUND_EMAIL_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.logger.directory)`
export CS_OUTBOUND_EMAIL_TMP=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.tmpDirectory)`
export CS_OUTBOUND_EMAIL_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.assetEnvironment)`
export CS_OUTBOUND_EMAIL_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.runTimeEnvironment)`
export CS_OUTBOUND_EMAIL_SQS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p queuingEngine.awsSQS.outboundEmailQueueName)`

# when running a VPN, set the mongo connect override to reference mongo via the vpn ip (lambda functions need to connect)
TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp)
[ -n "$TUNNEL_IP" ] && export CS_OUTBOUND_EMAIL_MONGO_URL=mongodb://$TUNNEL_IP/codestream
[ -n "$OUTBOUND_EMAIL_MONGO_URL" ] && echo "overriding mongo connection string: $CS_OUTBOUND_EMAIL_MONGO_URL"

. $CS_OUTBOUND_EMAIL_TOP/sandbox/lambda-configs/$CS_OUTBOUND_EMAIL_ENV.sh
