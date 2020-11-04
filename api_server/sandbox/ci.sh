
# use for continuous integration builds
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=dev
export CSSVC_ENV=ci
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_API_TOP/sandbox/defaults.sh
export CS_API_INIT_STOP_OPTS=useForce
