
. $DT_TOP/lib/sandbox_utils.sh

sandutil_load_options $CS_OUTBOUND_EMAIL_SANDBOX || { echo "failed to load options" >&2 && return 1; }

# node
[ -z "$CS_OUTBOUND_EMAIL_NODE_VER" ] && export CS_OUTBOUND_EMAIL_NODE_VER=10.15.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH

# sandbox bin directory is at front of search path
export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

# if the run-time env has been set as an option and no config file has been
# specified, assume this is a spin-up-dev instance and get the latest
# codestream-cloud development config file
if [ -n "$CSSVC_ENV" -a -z "$CS_OUTBOUND_EMAIL_CFG_FILE" ]; then
	export CS_OUTBOUND_EMAIL_CFG_FILE=$(/bin/ls $HOME/.codestream/config/codestream-cloud_dev_*_.json|tail -1)
	export CS_OUTBOUND_EMAIL_ENV=$CSSVC_ENV
	lambdaCfgFile=dev.sh
fi

# find the config file
sandutil_get_codestream_cfg_file "$CS_OUTBOUND_EMAIL_SANDBOX" "$CS_OUTBOUND_EMAIL_CFG_FILE"

# env vars required for scripts that don't load the config file
[ -z "$CS_OUTBOUND_EMAIL_ENV" ] && export CS_OUTBOUND_EMAIL_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.runTimeEnvironment)`
export CS_OUTBOUND_EMAIL_LOGS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.logger.directory)`
export CS_OUTBOUND_EMAIL_TMP=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.tmpDirectory)`
export CS_OUTBOUND_EMAIL_ASSET_ENV=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p outboundEmailServer.assetEnvironment)`
export CS_OUTBOUND_EMAIL_SQS=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p queuingEngine.awsSQS.outboundEmailQueueName)`
[ -z "$CS_OUTBOUND_EMAIL_SQS" ] && echo "AWS SQS is not configured as the queing engine. AWS lambda functions will not be supported." && export CS_OUTBOUND_EMAIL_NO_LAMBDA=1

# For local sandboxes, print a helpful message on how to switch
# between running as a lambda function vs. a local node process.
if [ "$CS_OUTBOUND_EMAIL_ENV" == local ]; then
	if [ -z "$CS_OUTBOUND_EMAIL_NO_LAMBDA" ]; then
		echo "
Your sandbox is configured for deployment as a lambda function.
If you want to run it as a node service on this computer run this
command, kill this shell and re-load your sandbox.

$ echo CS_OUTBOUND_EMAIL_NO_LAMBDA=1 >> $CS_OUTBOUND_EMAIL_SANDBOX/sb.options
"
	else
		echo "
Your sandbox is configured to run as a node service on this host. If
you want to run it as a lambda function, remove the setting line
from $CS_OUTBOUND_EMAIL_SANDBOX/sb.options, kill the shell and reload
the sandbox.
"
	fi
fi

[ -z "$lambdaCfgFile" ] && lambdaCfgFile=$CS_OUTBOUND_EMAIL_ENV.sh
[ -n "$CS_OUTBOUND_EMAIL_SQS" -a -z "$CS_OUTBOUND_EMAIL_NO_LAMBDA" ] && . $CS_OUTBOUND_EMAIL_TOP/sandbox/lambda-configs/$lambdaCfgFile
