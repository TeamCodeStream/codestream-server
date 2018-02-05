
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset"
MONGO_ACCESS_FILE="$HOME/.codestream/mongo/qa-codestream-dbowner"

. $CS_API_TOP/sandbox/defaults.sh

unset CS_API_SETUP_MONGO
export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=qa.codestream.com

# edit for production
# export CS_API_SSL_KEYFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-key
# export CS_API_SSL_CERTFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-crt
# export CS_API_SSL_CAFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-ca
