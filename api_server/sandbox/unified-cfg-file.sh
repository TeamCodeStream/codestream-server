
. $DT_TOP/lib/sandbox_utils.sh
. $CS_API_TOP/sandbox/lib/sbutils.sh

sandutil_load_options $CS_API_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_API_NODE_VER" ] && export CS_API_NODE_VER=10.15.3
export PATH=$CS_API_SANDBOX/node/bin:$CS_API_TOP/node_modules/.bin:$PATH

export PATH=$CS_API_TOP/bin:$PATH

[ -n "$CSSVC_ENV" ] && export CS_API_ENV=$CSSVC_ENV
[ -n "$CS_API_CFG_FILE" ] && configParm=$CS_API_CFG_FILE || configParm="$CSSVC_CONFIGURATION"
sandutil_get_codestream_cfg_file "$CS_API_SANDBOX" "$configParm" "$CSSVC_ENV"

# env vars required for aux scripts that don't use the config file
[ -z "$CS_API_ENV" ] && export CS_API_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.runTimeEnvironment)`
export CS_API_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.logger.directory)`
export CS_API_TMP=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.tmpDirectory)`
export CS_API_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.assetEnvironment)`

# this sets CS_API_CALLBACK_ENV
set_callback_env

# meh. not sure where this should go.
#
# local development on ec2 instances (remote hosts) should reference their
# hostname and not 'localhost' in URL's
if [ "$CS_API_ENV" == "local" ]; then
	[ `cat /etc/system-release 2>/dev/null | grep -i "Amazon Linux"|wc -l` -eq 1 ] && ec2Instance=1 || ec2Instance=0
	if [ $ec2Instance -eq 1 ]; then
		apiPort=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p apiServer.port)`
		export CS_API_PUBLIC_URL="https://`hostname`:$apiPort"
		echo "publicApiUrl = $CS_API_PUBLIC_URL (setting remote development host override)"
	fi
fi

# CONSIDER MOVING THIS TO THE CONFIG FILE!!
if [ `echo $CS_API_ENV | egrep -c -e '^(prod|qa)$'` -eq 1 ]; then
	echo 'ensure_indexes.js is disabled'
	unset CS_API_SETUP_MONGO
else
	export CS_API_SETUP_MONGO=true
fi
