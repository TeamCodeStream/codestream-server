
# use for spin-up onprem development environments
# export CSSVC_ENV=
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && export CS_BROADCASTER_ASSET_ENV=dev
export CSSVC_CONFIGURATION=onprem-development
. $CS_BROADCASTER_TOP/sandbox/defaults.sh
