#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export NODE_PATH=$SCRIPT_DIR/api_server/node_modules
eval "$("$SCRIPT_DIR"/api_server/bin/cs_dev_secrets.js)"
unset NODE_PATH
