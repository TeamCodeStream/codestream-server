
. $DT_TOP/lib/sandbox_utils.sh || { echo "error loading library $DT_TOP/lib/sandbox_utils.sh" >&2 && return 1; }

if [ -n "$CSBE_TOP" ]; then
	# ----- mono-repo
	export OPADM_REPO_ROOT=$CSBE_TOP
else
	# ----- single-service (api only)
	export OPADM_REPO_ROOT=$(. $OPADM_SANDBOX/sb.info; echo $OPADM_SANDBOX/$SB_REPO_ROOT)
	export CSSVC_BACKEND_ROOT=$OPADM_REPO_ROOT
fi
. $CSSVC_BACKEND_ROOT/sandbox/shared/sandbox_config.sh || return 1

# common sandbox initialization routines
sbcfg_initialize OPADM

if [ -z "$CSSVC_CFG_URL" ]; then
	# Check Core Variables
	sbcfg_check_cfg_prop adminServer.logger.directory OPADM_LOGS
fi

return 0
