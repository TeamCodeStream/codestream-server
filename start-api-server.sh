#!/usr/bin/env bash

# Secret environment variables must already be set in the environment via `source ./devSecrets.sh`

# if [[ -z "${BROADCAST_ENGINE_PUBNUB_BLUE_KEY_PUBLISH_KEY}" ]]; then
#   echo "Error: BROADCAST_ENGINE_PUBNUB_BLUE_KEY_PUBLISH_KEY env var was not found." >&2
#   echo "This indicates that the vault secrets have not been loaded. To load the vault secrets:" >&2
#   echo "1. run newrelic-vault us login -method=okta username=<username> totp=<totp>" >&2
#   echo "2. in your shell run . ./devSecrets.sh to populate the environment variables" >&2
#   echo "3. profit" >&2
#   exit 1
# fi

# Grab the non-secret environment variables from dev.env
# [ -f dev.env ] && export $(grep -v '^#' dev.env | xargs)

export CSSVC_BACKEND_ROOT=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export CSSVC_ENV=local
export NODE_PATH=$CSSVC_BACKEND_ROOT/broadcaster/node_modules:$CSSVC_BACKEND_ROOT/api_server/node_modules
export CSSVC_CFG_FILE="$CSSVC_BACKEND_ROOT/codestream-docker.json"
# export CS_API_SANDBOX=$CSSVC_BACKEND_ROOT
# export CS_API_LOGS=$CSSVC_BACKEND_ROOT/log
#export SSL_CA_FILE=$CSSVC_BACKEND_ROOT/certs/localhost.codestream.us.csr
#export SSL_CERT_FILE=$CSSVC_BACKEND_ROOT/certs/localhost.codestream.us.crt
#export SSL_KEY_FILE=$CSSVC_BACKEND_ROOT/certs/localhost.codestream.us.key
# export STORAGE_MONGO_URL="mongodb://localhost:27017/codestream"
# api_server/bin/set-globals.js
# api_server/bin/ensure-indexes.js build
api_server/bin/api_server.js --one_worker --dev_secrets
