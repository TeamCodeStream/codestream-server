
. $DT_TOP/lib/sandbox_utils.sh

# ----- Setup for Mono-Repo or Single-Service Sandbox
#       codestream-server sandboxes can be installed as one mono-repo or as one of its
#       constituent services (api, broadcaster, ...). Backend and repo root variables
#       will be set accordingly.
if [ -n "$CSBE_TOP" ]; then
	# ----- mono-repo
	export CS_OUTBOUND_EMAIL_REPO_ROOT=$CSBE_TOP
else
	# ----- single-service (api only)
	export CS_OUTBOUND_EMAIL_REPO_ROOT=$(. $CS_OUTBOUND_EMAIL_SANDBOX/sb.info; echo $CS_OUTBOUND_EMAIL_SANDBOX/$SB_REPO_ROOT)
	export CSSVC_BACKEND_ROOT=$CS_OUTBOUND_EMAIL_REPO_ROOT
fi
. $CSSVC_BACKEND_ROOT/sandbox/shared/sandbox_config.sh || return 1

# common sandbox initialization routines
sbcfg_initialize CS_OUTBOUND_EMAIL

# sanity checks for config file based sandboxes
if [ -n "$CSSVC_CFG_URL" ]; then
	# Hopefully these match the config in mongo
	[ -z "$CS_OUTBOUND_EMAIL_SQS" ] && export CS_OUTBOUND_EMAIL_SQS="local_${DT_USER}_outboundEmail"
else
	sbcfg_check_cfg_prop outboundEmailServer.logger.directory CS_OUTBOUND_EMAIL_LOGS
	sbcfg_check_cfg_prop outboundEmailServer.tmpDirectory CS_OUTBOUND_EMAIL_TMP
	sbcfg_check_cfg_prop queuingEngine.awsSQS.outboundEmailQueueName CS_OUTBOUND_EMAIL_SQS 2>/dev/null
fi

return 0
