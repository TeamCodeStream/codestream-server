
if [ -f "$CS_BROADCASTER_SANDBOX/sb.options" ]; then
	echo "Loading params from sb.options"
	. $CS_BROADCASTER_SANDBOX/sb.options
	export $(grep = $CS_BROADCASTER_SANDBOX/sb.options | grep -v '^#' | cut -f1 -d=)
fi

export CS_BROADCASTER_NODE_VER=10.15.3
export PATH=$CS_BROADCASTER_SANDBOX/node/bin:$CS_BROADCASTER_TOP/node_modules/.bin:$CS_BROADCASTER_TOP/bin:$PATH
[ -z "$CODESTREAM_CFG_FILE" ] && export CODESTREAM_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
