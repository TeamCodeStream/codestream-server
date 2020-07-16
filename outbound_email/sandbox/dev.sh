
# use for spin-up development environments
# export CSSVC_ENV=
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV" ] && export CS_OUTBOUND_EMAIL_ASSET_ENV=dev
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh
