
# use for the Persistent Development environment
[ -z "$CS_MAILIN_ASSET_ENV" ] && export CS_MAILIN_ASSET_ENV=dev
export CSSVC_ENV=pd
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_MAILIN_TOP/sandbox/defaults.sh
