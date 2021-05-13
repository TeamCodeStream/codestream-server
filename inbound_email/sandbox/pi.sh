
# use for production integration builds
[ -z "$CS_MAILIN_ASSET_ENV" ] && export CS_MAILIN_ASSET_ENV=prod
export CSSVC_ENV=pi
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_MAILIN_TOP/sandbox/defaults.sh
