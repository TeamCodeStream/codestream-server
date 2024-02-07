#!/usr/bin/env bash

function dev_settings {
    for configVar in `cat $SCRIPT_DIR/api_server/config/local.json|grep '"'|cut -f2 -d\"`; do
        value=$(grep "\"$configVar\":" $SCRIPT_DIR/api_server/config/local.json|grep '"'|cut -f4 -d\")
        echo "export $configVar='$value'"
    done
}

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export CSSVC_BACKEND_ROOT=$SCRIPT_DIR
export NODE_PATH="$CSSVC_BACKEND_ROOT/api_server/node_modules:$CSSVC_BACKEND_ROOT/broadcaster/node_modules"
eval `dev_settings`
export CS_API_MOCK_MODE='1'
export CSSVC_ENV=local
export CSSVC_CFG_FILE="$CSSVC_BACKEND_ROOT/codestream-docker.json"
