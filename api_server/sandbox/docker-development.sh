
# This sets up the runtime environment for running the API service
# in our docker development container

export CS_API_NODE_MODULES_DIR=/codestream/node_mods/$CS_API_NAME
export CS_API_NODE_MODULES_DIR=$HOME/node_mods/$CS_API_NAME
. $CS_API_TOP/sandbox/defaults.sh

export CS_API_NPM_INSTALL_XTRA_OPTS="--unsafe-perm --prefix=$CS_API_NODE_MODULES_DIR"
export CS_API_MONGO_HOST=localhost
export CS_API_MONGO_PORT=27017
