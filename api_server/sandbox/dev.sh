
# use for spin-up development environments
# export CSSVC_ENV=
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=dev
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_API_TOP/sandbox/defaults.sh
