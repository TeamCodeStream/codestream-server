
# use for production integration
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && export CS_BROADCASTER_ASSET_ENV=prod
export CSSVC_ENV=pi
export CSSVC_CONFIGURATION=onprem-development
. $CS_BROADCASTER_TOP/sandbox/defaults.sh
