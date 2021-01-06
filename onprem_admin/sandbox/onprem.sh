
# use for spin-up onprem dev environments
# export CSSVC_ENV=
[ -z "$OPADM_ASSET_ENV" ] && export OPADM_ASSET_ENV=dev
export CSSVC_CONFIGURATION=onprem-development
. $OPADM_TOP/sandbox/defaults.sh
