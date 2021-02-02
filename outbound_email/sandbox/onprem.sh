
# use for spin-up onprem development environments
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV" ] && export CS_OUTBOUND_EMAIL_ASSET_ENV=dev
[ -z "$CSSVC_CFG_URL" ] && export CSSVC_CFG_URL=mongodb://localhost/codestream
. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh
