
if [ -f "$CS_API_SANDBOX/sb.options" ]; then
	echo "Loading override parameters from $CS_API_SANDBOX/sb.options"
	. $CS_API_SANDBOX/sb.options
	export $(grep = $CS_API_SANDBOX/sb.options | grep -v '^#' | cut -f1 -d=)
fi

export CS_API_NODE_VER=10.15.3
export PATH=$CS_API_TOP/bin:$CS_API_SANDBOX/node/bin:$CS_API_TOP/node_modules/.bin:$PATH
[ -z "$CODESTREAM_CFG_FILE" ] && export CODESTREAM_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
# temporary
[ -z "$CS_API_CFG_FILE" ] && export CS_API_CFG_FILE=$CODESTREAM_CFG_FILE
