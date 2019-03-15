
# This sets up the runtime environment for running the API service
# in our docker development container

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_MONGO_HOST=localhost
export CS_API_MONGO_PORT=27017
