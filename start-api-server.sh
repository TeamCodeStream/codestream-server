#!/usr/bin/env bash

# Secret environment variables must already be set in the environment via `source ./devSecrets.sh`

# Grab the non-secret environment variables from dev.env
export $(cat dev.env | xargs)

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export CSSVC_CFG_FILE="$SCRIPT_DIR/codestream-docker.json"
export CSSVC_BACKEND_ROOT=$SCRIPT_DIR
export NODE_PATH=$SCRIPT_DIR/broadcaster/node_modules:$SCRIPT_DIR/api_server/node_modules
export SSL_CA_FILE=$SCRIPT_DIR/certs/localhost.codestream.us.csr
export SSL_CERT_FILE=$SCRIPT_DIR/certs/localhost.codestream.us.crt
export SSL_KEY_FILE=$SCRIPT_DIR/certs/localhost.codestream.us.key
export CS_API_PORT=12079
export STORAGE_MONGO_URL=mongodb://localhost:27017/codestream
export CS_API_LOGS=$SCRIPT_DIR/log
export CS_API_SANDBOX=$SCRIPT_DIR
export DT_USER=$USER
api_server/bin/ensure-indexes.js build
api_server/bin/api_server.js --one_worker
