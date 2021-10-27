
# functions that link to the hosts' mail service

[ -n "$__mail_service_opts_loaded" ] && return 0 || __mail_service_opts_loaded=1

function mail_service_is_running {
	[ "$DT_OS_DISTRO" != al2 ] && echo "DT_OS_DISTRO ($DT_OS_DISTRO) is not supported" && return 1
	ots-sys mail --is-running
}

function mail_service_init {
	echo ots-sys mail $1 --use-sudo-script
	ots-sys mail $1 --use-sudo-script
}

return 0
