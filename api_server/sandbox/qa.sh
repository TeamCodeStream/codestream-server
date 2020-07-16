
# qa
[ -z "$CS_API_ASSET_ENV" ] && export CS_API_ASSET_ENV=prod
export CSSVC_ENV=qa
export CSSVC_CONFIGURATION=codestream-cloud
. $CS_API_TOP/sandbox/defaults.sh
unset CS_API_SETUP_MONGO && echo "mongo setup is disabled"
# export CS_API_INIT_FAIL_MSG="sigkill did not stop the api service"
export CS_API_INIT_STOP_OPTS=useForce
