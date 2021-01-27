
# use for spin-up onprem development environments
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && export CS_BROADCASTER_ASSET_ENV=dev
[ -z "$CSSVC_CFG_URL" ] && export CSSVC_CFG_URL=mongodb://localhost/codestream
. $CS_BROADCASTER_TOP/sandbox/defaults.sh
