
# use for continuous integration in development
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && export CS_BROADCASTER_ASSET_ENV=dev
export CSSVC_ENV=ci
export CSSVC_CONFIGURATION=onprem-development
. $CS_BROADCASTER_TOP/sandbox/defaults.sh
