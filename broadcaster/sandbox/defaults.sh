
. $DT_TOP/lib/sandbox_utils.sh

if [ -n "$CSBE_TOP" ]; then
	# ----- mono-repo
	export CS_BROADCASTER_REPO_ROOT=$CSBE_TOP
else
	# ----- single-service (api only)
	export CS_BROADCASTER_REPO_ROOT=$(. $CS_BROADCASTER_SANDBOX/sb.info; echo $CS_BROADCASTER_SANDBOX/$SB_REPO_ROOT)
	export CSSVC_BACKEND_ROOT=$CS_BROADCASTER_REPO_ROOT
fi
. $CSSVC_BACKEND_ROOT/sandbox/shared/sandbox_config.sh || return 1

# common sandbox initialization routines
sbcfg_initialize CS_BROADCASTER

if [ -n "$CSSVC_CFG_URL" ]; then 
	# hope these match the mongo config
	[ -z "$CS_BROADCASTER_INBOUND_EMAIL_DIRECTORY" ] && export CS_BROADCASTER_INBOUND_EMAIL_DIRECTORY=${CS_BROADCASTER_SANDBOX}/mailq/new
	[ -z "$CS_BROADCASTER_TEMP_ATTACHMENT_DIRECTORY" ] && export CS_BROADCASTER_TEMP_ATTACHMENT_DIRECTORY=${CS_BROADCASTER_SANDBOX}/mailq/attachments
	[ -z "$CS_BROADCASTER_PROCESS_DIRECTORY" ] && export CS_BROADCASTER_PROCESS_DIRECTORY=${CS_BROADCASTER_SANDBOX}/mailq/process
else
	# Check Core Variables
	sbcfg_check_cfg_prop broadcastEngine.codestreamBroadcaster.logger.directory inboundEmailServer.logger.directory CS_BROADCASTER_LOGS 2>/dev/null
	sbcfg_check_cfg_prop inboundEmailServer.tmpDirectory CS_BROADCASTER_TMP

	[ -z "`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p broadcastEngine.codestreamBroadcaster.host 2>/dev/null)`" ] && echo "The config file does not support the codestream broadcaster as a broadcastEngine. This sandbox is DOA." && export CS_BROADCASTER_DOA=1
fi

return 0
