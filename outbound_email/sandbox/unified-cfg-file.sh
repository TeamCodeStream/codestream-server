
if [ -f "$CS_OUTBOUND_EMAIL_SANDBOX/sb.options" ]; then
	echo "Loading override parameters from $CS_OUTBOUND_EMAIL_SANDBOX/sb.options"
	. $CS_OUTBOUND_EMAIL_SANDBOX/sb.options
	export $(grep = $CS_OUTBOUND_EMAIL_SANDBOX/sb.options | grep -v '^#' | cut -f1 -d=)
fi

export CS_OUTBOUND_EMAIL_NODE_VER=10.15.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$CS_OUTBOUND_EMAIL_TOP/bin:$PATH
[ -z "$CODESTREAM_CFG_FILE" ] && export CODESTREAM_CFG_FILE=$HOME/.codestream/config/codestream-services-config.json
