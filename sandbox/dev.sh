
# use for spin-up cloud environments (non-local development)

[ -z "$CSBE_ASSET_ENV" ] && export CSBE_ASSET_ENV=dev
[ -z "$CSSVC_ENV" ] && export CSSVC_ENV=dev
[ -z "$CSSVC_CONFIGURATION" ] && export CSSVC_CONFIGURATION=codestream-cloud
. $CSBE_TOP/sandbox/defaults.sh
