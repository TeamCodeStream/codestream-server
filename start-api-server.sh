#!/usr/bin/env bash

# Secret environment variables must already be set in the environment via `source ./devSecrets.sh`

if [[ -z "${BROADCAST_ENGINE_PUBNUB_BLUE_KEY_PUBLISH_KEY}" ]]; then
  echo "Error: BROADCAST_ENGINE_PUBNUB_BLUE_KEY_PUBLISH_KEY env var was not found." >&2
  echo "This indicates that the vault secrets have not been loaded. To load the vault secrets:" >&2
  echo "1. run newrelic-vault us login -method=okta username=<username> totp=<totp>" >&2
  echo "2. in your shell run . ./devSecrets.sh to populate the environment variables" >&2
  echo "3. profit" >&2
  exit 1
fi

# Grab the non-secret environment variables from dev.env
export $(grep -v '^#' dev.env | xargs)

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export CSSVC_CFG_FILE="$SCRIPT_DIR/codestream-docker.json"
export CSSVC_BACKEND_ROOT=$SCRIPT_DIR
export CS_API_SANDBOX=$SCRIPT_DIR
export CS_API_LOGS=$SCRIPT_DIR/log
export NODE_PATH=$SCRIPT_DIR/broadcaster/node_modules:$SCRIPT_DIR/api_server/node_modules
#export SSL_CA_FILE=$SCRIPT_DIR/certs/localhost.codestream.us.csr
#export SSL_CERT_FILE=$SCRIPT_DIR/certs/localhost.codestream.us.crt
#export SSL_KEY_FILE=$SCRIPT_DIR/certs/localhost.codestream.us.key
export CS_API_PORT=12078
export STORAGE_MONGO_URL=mongodb://localhost:27017/codestream
api_server/bin/set-globals.js
api_server/bin/ensure-indexes.js build
api_server/bin/api_server.js --one_worker
