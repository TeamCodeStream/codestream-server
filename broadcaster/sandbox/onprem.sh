
# use for continuous integration in development
# export CSSVC_ENV=
[ -z "$CSSVC_CONFIGURATION" ] && export CSSVC_CONFIGURATION=onprem-development
. $CS_BROADCASTER_TOP/sandbox/unified-cfg-file.sh
