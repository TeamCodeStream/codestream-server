
# use for production integration builds
[ -z "$OPADM_ASSET_ENV" ] && export OPADM_ASSET_ENV=prod
export CSSVC_ENV=pi
export CSSVC_CONFIGURATION=onprem-development
. $OPADM_TOP/sandbox/defaults.sh
