
# use for spin-up onprem dev environments
[ -z "$OPADM_ASSET_ENV" ] && export OPADM_ASSET_ENV=dev
[ -z "$CSSVC_CFG_URL" ] && export CSSVC_CFG_URL=mongodb://localhost/codestream
. $OPADM_TOP/sandbox/defaults.sh
