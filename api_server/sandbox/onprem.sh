
# use for spin-up onprem development environments
# export CSSVC_ENV=
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=dev
export CSSVC_CONFIGURATION=onprem-development
. $CS_API_TOP/sandbox/defaults.sh
