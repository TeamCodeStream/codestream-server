
# This is used to confiture an API sandbox for testing the CI inbound-email sandbox

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_MONGO_PORT=$MDB_PORT
export CS_API_SSL_KEYFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-key
export CS_API_SSL_CERTFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-crt
export CS_API_SSL_CAFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-ca
export CS_API_PORT=12179
export CS_API_REPLY_TO_DOMAIN=pd.codestream.com
