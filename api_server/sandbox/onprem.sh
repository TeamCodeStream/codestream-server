
# use for spin-up onprem environments (non-local development using sandboxes)

# config will be loaded into mongodb on first run

[ -z "$CSSVC_ENV" ] && export CSSVC_ENV=dev
[ -z "$CSSVC_CFG_URL" ] && export CSSVC_CFG_URL=mongodb://localhost/codestream
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=dev

. $CS_API_TOP/sandbox/defaults.sh

if [ -z "$CS_API_DEFAULT_CFG_FILE" ]; then
	[ -z "$CSSVC_CONFIGURATION" ] && CSSVC_CONFIGURATION="onprem-development"
	sandutil_get_codestream_cfg_file "$CS_API_SANDBOX" "$CSSVC_CONFIGURATION" "$CSSVC_ENV"
	export CS_API_DEFAULT_CFG_FILE=$CSSVC_CFG_FILE
	unset CSSVC_CFG_FILE
	[ -z "$CS_API_DEFAULT_CFG_FILE" ] && echo "WARN: could not find a default config to use at startup. Falling back to onprem-developmen"
fi
return 0
