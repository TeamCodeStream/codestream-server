
# Create default variable settings in this file

# Set by development tools
# CS_API_NAME     Name of the sandbox
# CS_API_SANDBOX  /path/to/root/of/sandbox
# CS_API_TOP      /path/to/root/of/primary/git/project

export PATH=$CS_API_SANDBOX/node/bin:$CS_API_SANDBOX/yarn/bin:$CS_API_TOP/bin:$CS_API_TOP/node_modules/.bin:$PATH
export CS_API_TOP=$CS_API_TOP
export CS_API_HOST=localhost
export CS_API_PORT=12079
export CS_API_AUTH_SECRET="A*y8lN^erPHf$"
export CS_API_LOG_DIRECTORY=$CS_API_SANDBOX/log
export CS_API_LOG_CONSOLE_OK=1
export CS_API_SSL_CERT_DIR=$HOME/.certs/wildcard.codestream.us
[ ! -d $CS_API_SSL_CERT_DIR ] && export CS_API_SSL_CERT_DIR=/etc/pki/wildcard.codestream.us
export CS_API_SSL_KEYFILE=$CS_API_SSL_CERT_DIR/wildcard.codestream.us-key
export CS_API_SSL_CERTFILE=$CS_API_SSL_CERT_DIR/wildcard.codestream.us-crt
export CS_API_SSL_CAFILE=$CS_API_SSL_CERT_DIR/wildcard.codestream.us-ca

# Mongo
export CS_API_MONGO_HOST=$MDB_HOST
export CS_API_MONGO_PORT=$MDB_PORT
export CS_API_MONGO_DATABASE=codestream

# Uncomment these to tell the API service to use mongo authentication
#export CS_API_MONGO_USER=api
#export CS_API_MONGO_PASS=api

# Uncomment these if you want the mdb-mongo CLI to access the database
# using the system account above (as opposed to 'root')
#export MDB_CLI_USER=$CS_API_MONGO_USER
#export MDB_CLI_PASS=$CS_API_MONGO_PASS

# Construct the mongo URL (needed if authentication is used)
#export CS_API_MONGO_URL="mongodb://$CS_API_MONGO_USER:$CS_API_MONGO_PASS@$CS_API_MONGO_HOST:$CS_API_MONGO_PORT/$CS_API_MONGO_DATABASE"

# Tell the API service init script to setup mongo when it the api server
# is started for the first time. This includes creating the database
# owner in mongo and creating the indexes
export CS_API_SETUP_MONGO=true


# Emails by default are not sent ... set this to "on" to send emails normally
# (as in production, and exercise extreme caution when testing) ...
# or set to a valid email to have all emails diverted to the specified address,
# this is good and risk-free for developer testing
#export CS_API_EMAIL_TO=

# By default we require email confirmation, but for developer convenience
# during testing, the requirement of email confirmation can be turned off
# To turn off the email confirmation requrement, set the below to "1"
#export CS_API_CONFIRMATION_NOT_REQUIRED=

# see README.pubnub for more details
export CS_API_PUBNUB_PUBLISH_KEY=pub-c-8603fed4-39da-4feb-a82e-cf5311ddb4d6
export CS_API_PUBNUB_SUBSCRIBE_KEY=sub-c-e830d7da-fb14-11e6-9f57-02ee2ddab7fe
export CS_API_PUBNUB_SECRET=sec-c-MmU3MmNlOGQtNjNhYS00NTk1LWI3NDItZDZlMjk3NmJkMDVh

# Specify the yarn package manager
export CS_API_YARN=true

# Specify the path to our "test repo"
export CS_API_TEST_REPO_PATH=
