
# use for continuous integration builds
[ -z "$OPADM_ASSET_ENV" ] && export OPADM_ASSET_ENV=dev
export CSSVC_ENV=ci
export CSSVC_CONFIGURATION=onprem-development
. $OPADM_TOP/sandbox/defaults.sh
