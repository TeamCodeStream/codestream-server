
# For dual-region development, use local1 & local2 sandboxes
[ -z "$CSSVC_ENV" ] && export CSSVC_ENV=local1
. $CSBE_TOP/sandbox/defaults.sh
