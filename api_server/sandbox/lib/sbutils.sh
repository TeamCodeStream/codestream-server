
# shell functions shared across api sandbox configurations

function set_callback_env {
	if [ "$CS_API_ENV" == local  -a  -z "$CS_API_CALLBACK_ENV" ]; then
		TUNNEL_IP=$(sandutil_get_tunnel_ip fallbackLocalIp,useHyphens)
		[ -n "$TUNNEL_IP" ] && export CS_API_CALLBACK_ENV="local-$TUNNEL_IP" || echo "could not detect your vpn ip - callbacks won't work" >&2
	elif [ -z "$CS_API_CALLBACK_ENV" ]; then
		export CS_API_CALLBACK_ENV=$CS_API_ENV
		[ -z "$CS_API_CALLBACK_ENV" ] && echo "CS_API_ENV is not defined - could not set callback env" >&2
	fi
}
