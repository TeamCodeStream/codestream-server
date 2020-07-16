
# use for spin-up development environments
# export CSSVC_ENV=
[ -z "$CS_BROADCASTER_ASSET_ENV" ] && export CS_BROADCASTER_ASSET_ENV=dev
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_BROADCASTER_TOP/sandbox/defaults.sh
