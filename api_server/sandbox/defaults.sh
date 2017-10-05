
# Create default variable settings in this file

# Set by development tools
# CI_API_NAME     Name of the sandbox
# CI_API_SANDBOX  /path/to/root/of/sandbox
# CI_API_TOP      /path/to/root/of/primary/git/project

export PATH=$CI_API_SANDBOX/node/bin:$CI_API_TOP/bin:$PATH

export CI_API_TOP=$CI_API_TOP
export CI_API_MONGO_HOST=$MDB_HOST
export CI_API_MONGO_PORT=$MDB_PORT
export CI_API_MONGO_DATABASE=codestream
export CI_API_HOST=localhost
export CI_API_PORT=12079
export CI_API_SECRET=RCf*ck3dGl1p
export CI_API_AUTH_SECRET=f*cky0uRC!
export CI_API_LOG_DIRECTORY=$CI_API_SANDBOX/log
export CI_API_LOG_CONSOLE_OK=1
export CI_API_SSL_KEYFILE=$HOME/.certs/wildcard.codestream.us/wildcard.codestream.us-key
export CI_API_SSL_CERTFILE=$HOME/.certs/wildcard.codestream.us/wildcard.codestream.us-crt
export CI_API_SSL_CAFILE=$HOME/.certs/wildcard.codestream.us/wildcard.codestream.us-ca

# see README.pubnub for more details
export CI_API_PUBNUB_PUBLISH_KEY=pub-c-8603fed4-39da-4feb-a82e-cf5311ddb4d6
export CI_API_PUBNUB_SUBSCRIBE_KEY=sub-c-e830d7da-fb14-11e6-9f57-02ee2ddab7fe
export CI_API_PUBNUB_SECRET=sec-c-MmU3MmNlOGQtNjNhYS00NTk1LWI3NDItZDZlMjk3NmJkMDVh
