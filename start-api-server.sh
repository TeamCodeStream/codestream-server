#!/usr/bin/env bash

echo "$*" | egrep -q '\-(help|h)' && echo "usage: $0 [-init-db-only | -no-db | -enable-mailout ]" && exit 1

function init_database {
	local unset_after=0
	[ -z "$STORAGE_MONGO_URL" ] && unset_after=1 && export STORAGE_MONGO_URL=$(newrelic-vault us read -field=value containers/teams/codestream/services/codestream-server/base/STORAGE_MONGO_URL)
	[ -z "$STORAGE_MONGO_URL" ] && echo "unable to read STORAGE_MONGO_URL from vault" && exit 1
	api_server/bin/set-globals.js || { echo "set-globals failed"l; exit 1; }
	api_server/bin/ensure-indexes.js build || { echo "ensure-indexes failed"; exit 1; }
	[ $unset_after -eq 1 ] && unset STORAGE_MONGO_URL
}

export CSSVC_BACKEND_ROOT=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export CSSVC_ENV=local
export NODE_PATH="$CSSVC_BACKEND_ROOT/api_server/node_modules:$CSSVC_BACKEND_ROOT/broadcaster/node_modules"
export CSSVC_CFG_FILE="$CSSVC_BACKEND_ROOT/codestream-docker.json"

echo "
CSSVC_BACKEND_ROOT=$CSSVC_BACKEND_ROOT
CSSVC_CFG_FILE=$CSSVC_CFG_FILE
CSSVC_ENV=$CSSVC_ENV
"

echo "$*" | grep -q '\-mock-mode' && {
	echo "======= Mocky ======="
	export CS_API_MOCK_MODE=1
}

echo "$*" | grep -q '\-no-db' || {
	echo "======= Initializing database ======="
	init_database
}
echo "$*" | grep -q '\-init-db-only' && exit 0

echo "======== Starting API ========="
echo "$*" | grep -q '-enable-mailout' && source ./enable-mailout.env.sh && echo "API will queue outbound email to SQS $CSSVC_OUTBOUND_EMAIL_QUEUE_NAME"
api_server/bin/api_server.js --one_worker --dev_secrets
