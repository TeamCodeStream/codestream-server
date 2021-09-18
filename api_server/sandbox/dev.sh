
# use for spin-up cloud environments (non-local development)

[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=dev
[ -z "$CSSVC_ENV" ] && export CSSVC_ENV=dev
[ -z "$CSSVC_CONFIGURATION" ] && export CSSVC_CONFIGURATION=codestream-cloud
. $CS_API_TOP/sandbox/defaults.sh
