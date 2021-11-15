
# Staging
[ -z "$CS_MAILIN_ASSET_ENV" ] && export CS_MAILIN_ASSET_ENV=dev
export CSSVC_ENV=stg
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_MAILIN_TOP/sandbox/defaults.sh || return 1

# involve the system mailer in mailin service init actions
export CS_MAILIN_MAIL_SERVICE_INIT=1
