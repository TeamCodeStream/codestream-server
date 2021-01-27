
. $DT_TOP/lib/sandbox_utils.sh

if [ -n "$CSBE_TOP" ]; then
	# ----- mono-repo
	export CS_MAILIN_REPO_ROOT=$CSBE_TOP
else
	# ----- single-service (api only)
	export CS_MAILIN_REPO_ROOT=$(. $CS_MAILIN_SANDBOX/sb.info; echo $CS_MAILIN_SANDBOX/$SB_REPO_ROOT)
	export CSSVC_BACKEND_ROOT=$CS_MAILIN_REPO_ROOT
fi
. $CSSVC_BACKEND_ROOT/sandbox/shared/sandbox_config.sh || return 1

# common sandbox initialization routines
sbcfg_initialize CS_MAILIN

if [ -n "$CSSVC_CFG_URL" ]; then
	# hope these match the mongo config
	[ -z "$CS_MAILIN_INBOUND_EMAIL_DIRECTORY" ] && export CS_MAILIN_INBOUND_EMAIL_DIRECTORY=${CS_MAILIN_SANDBOX}/mailq/new
	[ -z "$CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY" ] && export CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY=${CS_MAILIN_SANDBOX}/mailq/attachments
	[ -z "$CS_MAILIN_PROCESS_DIRECTORY" ] && export CS_MAILIN_PROCESS_DIRECTORY=${CS_MAILIN_SANDBOX}/mailq/process
else
	# Check Core Variables
	sbcfg_check_cfg_prop inboundEmailServer.logger.directory CS_MAILIN_LOGS
	sbcfg_check_cfg_prop inboundEmailServer.tmpDirectory CS_MAILIN_TMP

	# Set add'l parms from log
	export CS_MAILIN_INBOUND_EMAIL_DIRECTORY=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p inboundEmailServer.inboundEmailDirectory)`
	export CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p inboundEmailServer.tempAttachmentDirectory)`
	export CS_MAILIN_PROCESS_DIRECTORY=`eval echo $(get-json-property -j $CSSVC_CFG_FILE -p inboundEmailServer.processDirectory)`
fi

# Make mail processing directories if need be
[ ! -d $CS_MAILIN_INBOUND_EMAIL_DIRECTORY ] && echo "Creating $CS_MAILIN_INBOUND_EMAIL_DIRECTORY" && mkdir -p $CS_MAILIN_INBOUND_EMAIL_DIRECTORY
[ ! -d $CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY ] && echo "Creating $CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY" && mkdir -p $CS_MAILIN_TEMP_ATTACHMENT_DIRECTORY
[ ! -d $CS_MAILIN_PROCESS_DIRECTORY ] && echo "Creating $CS_MAILIN_PROCESS_DIRECTORY" && mkdir $CS_MAILIN_PROCESS_DIRECTORY

# CONSIDER MOVING THIS TO THE CONFIG FILE!!
# For the local poller service (cs_mailin-local-poller) - development only
[ "$CSSVC_ENV" = "local" ] && export CS_MAILIN_REMOTE_INBOUND_MAIL_SERVER=web@localmail.codestream.us
[ "$CSSVC_ENV" = "local" ] && export CS_MAILIN_REMOTE_INBOUND_MAIL_DIR=/home/web/codestream-mail/inbound/web/new

return 0
