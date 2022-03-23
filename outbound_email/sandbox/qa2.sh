
# use for QA2 EU
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV" ] && export CS_OUTBOUND_EMAIL_ASSET_ENV=prod
export CSSVC_ENV=qa2
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh
