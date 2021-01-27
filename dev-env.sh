
# This file is meant to be sourced into the shell environment

[ ! -d .git -o ! -d ./api_server ] && echo "change to the root of your codestream-server repo before sourcing in this file" && return 1
[ -n "$CSBE_SANDBOX" ] && echo "this env config is not compatble with your dev_tools sandbox" && return 1

[ -f .sandbox-config.sh ] && source .sandbox-config.sh && echo "loading .sandbox-config.sh"

[ -z "$CSSVC_BACKEND_ROOT" ] && export CSSVC_BACKEND_ROOT=$(pwd)
# [ -z "$CSSVC_ENV" ] && export CSSVC_ENV=local
[ -z "$CSSVC_CFG_URL" ] && export CSSVC_CFG_URL=mongodb://localhost/codestream

# update paths
export PATH=$CSSVC_BACKEND_ROOT/api_server/bin:$CSSVC_BACKEND_ROOT/broadcaster/bin:$CSSVC_BACKEND_ROOT/outbound_email/bin:$CSSVC_BACKEND_ROOT/inbound_email/bin:$PATH
export NODE_PATH=$CSSVC_BACKEND_ROOT/api_server/node_modules:$CSSVC_BACKEND_ROOT/broadcaster/node_modules:$CSSVC_BACKEND_ROOT/outbound_email/server/node_modules:$CSSVC_BACKEND_ROOT/inbound_email/node_modules:$CSSVC_BACKEND_ROOT/onprem_admin/node_modules:$NODE_PATH

[ ! -d "$CSSVC_BACKEND_ROOT/log" ] && { echo "creating $CSSVC_BACKEND_ROOT/log/ for run-time logs" && mkdir $CSSVC_BACKEND_ROOT/log || return 1; }

# temporary - these need to be removed from the default.json file
[ -z "$OPADM_LOGS" ] && export OPADM_LOGS=$CSSVC_BACKEND_ROOT/log
[ -z "$CS_API_LOGS" ] && export CS_API_LOGS=$CSSVC_BACKEND_ROOT/log
[ -z "$CS_BROADCASTER_SANDBOX" ] && export CS_BROADCASTER_SANDBOX=$CSSVC_BACKEND_ROOT
[ -z "$CS_MAILIN_SANDBOX" ] && export CS_MAILIN_SANDBOX=$CSSVC_BACKEND_ROOT
[ -z "$CS_OUTBOUND_EMAIL_LOGS" ] && export CS_OUTBOUND_EMAIL_LOGS=$CSSVC_BACKEND_ROOT/log
[ -z "$CS_OUTBOUND_EMAIL_TMP" ] && export CS_OUTBOUND_EMAIL_TMP=$CSSVC_BACKEND_ROOT/log

[[ "$SHELL" == *zsh* ]] && rehash
env | grep ^CSSVC_
return 0
