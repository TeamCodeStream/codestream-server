
# use for QA
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV" ] && export CS_OUTBOUND_EMAIL_ASSET_ENV=prod
export CSSVC_ENV=qa
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh
