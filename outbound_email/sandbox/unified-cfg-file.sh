
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_OUTBOUND_EMAIL_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_OUTBOUND_EMAIL_NODE_VER" ] && export CS_OUTBOUND_EMAIL_NODE_VER=10.15.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH

export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

[ -z "$CSSVC_CFG_FILE" -a -z "$CS_OUTBOUND_EMAIL_CFG_FILE" ] && export CS_OUTBOUND_EMAIL_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
[ -n "$CSSVC_CFG_FILE" ] && cfgFile=$CSSVC_CFG_FILE || cfgFile=$CS_OUTBOUND_EMAIL_CFG_FILE
echo "Using config file $cfgFile"

# env vars required for scripts that don't load the config file
export CS_OUTBOUND_EMAIL_LOGS=`eval echo $(get-json-property -j $cfgFile -p outboundEmailServer.logger.directory)`
export CS_OUTBOUND_EMAIL_TMP=`eval echo $(get-json-property -j $cfgFile -p outboundEmailServer.tmpDirectory)`
export CS_OUTBOUND_EMAIL_ASSET_ENV=`eval echo $(get-json-property -j $cfgFile -p outboundEmailServer.assetEnvironment)`
export CS_OUTBOUND_EMAIL_ENV=`eval echo $(get-json-property -j $cfgFile -p outboundEmailServer.runTimeEnvironment)`

export CSSVC_TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp)
echo "VPN tunnel IP (CSSVC_TUNNEL_IP): $CSSVC_TUNNEL_IP"
