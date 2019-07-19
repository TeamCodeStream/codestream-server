
# shell functions shared across api sandbox configurations

function set_callback_env {
	if [ "$CS_API_ENV" == local  -a  -z "$CS_API_CALLBACK_ENV" ]; then
		TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp,useHyphens)
		[ -n "$TUNNEL_IP" ] && export CS_API_CALLBACK_ENV="local-$TUNNEL_IP"
	elif [ -z "$CS_API_CALLBACK_ENV" ]; then
		export CS_API_CALLBACK_ENV=$CS_API_ENV
	fi
	[ -z "$CS_API_CALLBACK_ENV" ] && echo "CS_API_ENV is not defined - cannot set callback env" >&2
}
