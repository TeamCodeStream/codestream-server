
# use for onprem SLH quickstart config (non-local development)

# config will be loaded into mongodb on first run

[ -z "$CSSVC_ENV" ] && export CSSVC_ENV=dev
[ -z "$CSSVC_CFG_URL" ] && export CSSVC_CFG_URL=mongodb://localhost/codestream
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=dev

. $CS_API_TOP/sandbox/defaults.sh

# FIXME: these should only be set if the db is uninitialized??
export CS_API_DEFAULT_CFG_FILE=$CS_API_TOP/etc/configs/onprem-slh-quickstart.json
# expect port 80 to be redirected to 4080
[ -z "$CS_API_SET_PUBLIC_API_URL" ] && export CS_API_SET_PUBLIC_API_URL="http://`hostname`"
export CS_API_SET_PORT=4080
