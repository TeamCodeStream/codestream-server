
# use for spin-up onprem development environments
# export CSSVC_ENV=
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV" ] && export CS_OUTBOUND_EMAIL_ASSET_ENV=dev
export CSSVC_CONFIGURATION=onprem-development
. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh
