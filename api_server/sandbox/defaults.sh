
. $DT_TOP/lib/sandbox_utils.sh

# ----- Setup for Mono-Repo or Single-Service Sandbox
#       codestream-server sandboxes can be installed as one mono-repo or as one of its
#       constituent services (api, broadcaster, ...). Backend and repo root variables
#       will be set accordingly.
if [ -n "$CSBE_TOP" ]; then
	# ----- mono-repo
	export CS_API_REPO_ROOT=$CSBE_TOP
else
	# ----- single-service (api only)
	export CS_API_REPO_ROOT=$(. $CS_API_SANDBOX/sb.info; echo $CS_API_SANDBOX/$SB_REPO_ROOT)
	export CSSVC_BACKEND_ROOT=$CS_API_REPO_ROOT
fi
. $CSSVC_BACKEND_ROOT/sandbox/shared/sandbox_config.sh || return 1

# common sandbox initialization routines
sbcfg_initialize CS_API

# sanity checks for config file based sandboxes
if [ -z "$CSSVC_CFG_URL" ]; then
	sbcfg_check_cfg_prop apiServer.logger.directory CS_API_LOGS
fi

# local development sets the callback env so external requests can be routed
# through the network proxy and back to your local VPN IP (codestream version of
# https://ngrok.com)
if [ "$CSSVC_ENV" = "local"  -a  -z "$CS_API_CALLBACK_ENV" ]; then
	TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp,useHyphens)
	[ -n "$TUNNEL_IP" ] && export CS_API_CALLBACK_ENV="local-$TUNNEL_IP" || echo "could not detect your vpn ip - callbacks won't work" >&2
	[ -n "$CS_API_CALLBACK_ENV" ] && echo "CS_API_CALLBACK_ENV=$CS_API_CALLBACK_ENV"
elif [ -z "$CS_API_CALLBACK_ENV" ]; then
	export CS_API_CALLBACK_ENV=$CSSVC_ENV
fi

# Instructs the service init script to initialize the database and run
# ensure_indexes.js whenever the api service is started
export CS_API_SETUP_MONGO=true

return 0
