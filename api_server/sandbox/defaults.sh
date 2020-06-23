
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_API_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
if [ -z "$CSBE_NODE_VER" ]; then
	[ -z "$CS_API_NODE_VER" ] && export CS_API_NODE_VER=12.14.1
	export PATH=$CS_API_SANDBOX/node/bin:$CS_API_TOP/node_modules/.bin:$PATH
fi
export PATH=$CS_API_TOP/bin:$PATH
export NODE_PATH=$CS_API_TOP/node_modules:$NODE_PATH

[ -z "$CS_API_LOGS" ] && export CS_API_LOGS=$CS_API_SANDBOX/log
[ -z "$CS_API_PIDS" ] && export CS_API_PIDS=$CS_API_SANDBOX/pid
[ -z "$CS_API_TMP" ] && export CS_API_TMP=$CS_API_SANDBOX/tmp
[ -z "$CS_API_CONFS" ] && export CS_API_CONFS=$CS_API_SANDBOX/conf
[ -z "$CS_API_DATA" ] && export CS_API_DATA=$CS_API_SANDBOX/data

if [ -n "$CSSVC_CFG_URL" ]; then
	echo "looking for config from $CSSVC_CFG_URL"
	export CSSVC_ENV=`eval echo $(get-json-property --config-url $CSSVC_CFG_URL -p sharedGeneral.runTimeEnvironment)`
	export CS_API_ASSET_ENV=`eval echo $(get-json-property --config-url $CSSVC_CFG_URL -p apiServer.assetEnvironment)`
	apiPort=`eval echo $(get-json-property --config-url $CSSVC_CFG_URL -p apiServer.assetEnvironment)`
else
	[ -n "$CS_API_CFG_FILE" ] && configParm=$CS_API_CFG_FILE || configParm="$CSSVC_CONFIGURATION"
	[ -z "$CSSVC_CFG_FILE" ] && sandutil_get_codestream_cfg_file "$CS_API_SANDBOX" "$configParm" "$CSSVC_ENV"
	export CSSVC_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p sharedGeneral.runTimeEnvironment)`
	export CS_API_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.assetEnvironment)`
	apiPort=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.port)`
fi

# sanity check
[ -n "$CS_API_CFG_FILE" -a \( "$CSSVC_CFG_FILE" != "$CS_API_CFG_FILE" \) ] && echo "**** WARNING: CS_API_CFG_FILE != CSSVC_CFG_FILE"

# needed for the build process
export CS_API_ENV=$CSSVC_ENV

# local development sets the callback env so external requests can be routed
# through the network proxy and back to your local VPN IP (codestream version of
# https://ngrok.com)
if [ "$CSSVC_ENV" == local  -a  -z "$CS_API_CALLBACK_ENV" ]; then
	TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp,useHyphens)
	[ -n "$TUNNEL_IP" ] && export CS_API_CALLBACK_ENV="local-$TUNNEL_IP" || echo "could not detect your vpn ip - callbacks won't work" >&2
	[ -n "$CS_API_CALLBACK_ENV" ] && echo "CS_API_CALLBACK_ENV = $CS_API_CALLBACK_ENV"
elif [ -z "$CS_API_CALLBACK_ENV" ]; then
	export CS_API_CALLBACK_ENV=$CSSVC_ENV
fi


# local development on ec2 instances (remote hosts) should reference their
# hostname and not 'localhost' when constructing URLs so we set
if [ "$CSSVC_ENV" == "local" ]; then
	if [ $(sandutil_is_network_instance) -eq 1 ]; then
		export CS_API_PUBLIC_URL="https://`hostname`:$apiPort"
		echo "CS_API_PUBLIC_URL = $CS_API_PUBLIC_URL [this is a network development host]"
	fi
fi

# Instructs the service init script to initialize the database and run
# ensure_indexes.js whenever the api service is started
export CS_API_SETUP_MONGO=true


# Multiple installations - mono-repo and individual - have the same repo root ($REPO_ROOT/.git/)
. $CS_API_SANDBOX/sb.info
[ -n "$SB_REPO_ROOT" ] && export CS_API_REPO_ROOT=$CS_API_SANDBOX/$SB_REPO_ROOT || export CS_API_REPO_ROOT=$CS_API_TOP
[ -z "$CSSVC_BACKEND_ROOT" ] && export CSSVC_BACKEND_ROOT=$CS_API_REPO_ROOT
