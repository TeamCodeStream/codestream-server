#!/usr/bin/env bash

function init_database {
    export STORAGE_MONGO_URL=$(grep '"STORAGE_MONGO_URL"' api_server/config/local.json | cut -f4 -d\")
    api_server/bin/set-globals.js || { echo "set-globals failed"l; exit 1; }
    api_server/bin/ensure-indexes.js build || { echo "ensure-indexes failed"; exit 1; }
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

echo "======= Initializing database ======="
init_database
echo "$*" | grep -q '\-init-db-only' && exit 0

echo "======== Starting API ========="
api_server/bin/api_server.js --one_worker --dev_secrets
