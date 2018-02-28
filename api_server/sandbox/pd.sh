
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-PD_Keyset"

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_MONGO_PORT=$MDB_PORT
export CS_API_SSL_KEYFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-key
export CS_API_SSL_CERTFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-crt
export CS_API_SSL_CAFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-ca
export CS_API_PORT=9443
export CS_API_EMAIL_TO=on
export CS_API_REPLY_TO_DOMAIN=pd.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="dev_pd_outboundEmail"
