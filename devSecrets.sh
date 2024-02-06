#!/usr/bin/env bash

function dev_settings {
    for configVar in `cat $SCRIPT_DIR/api_server/config/local.json|grep '"'|cut -f2 -d\"`; do
        value=$(grep "\"$configVar\":" $SCRIPT_DIR/api_server/config/local.json|grep '"'|cut -f4 -d\")
        echo "export $configVar='$value'"
    done
}

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export NODE_PATH=$SCRIPT_DIR/api_server/node_modules
eval `dev_settings`

unset NODE_PATH
