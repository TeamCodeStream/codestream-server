
. $CS_API_TOP/sandbox/defaults.sh

# QA Pubnub Keys
[ ! -f $HOME/.codestream/pubnub/CodeStream-Testing-QA_Keyset ] && echo "QA PubNub keys not found" && return 1
. $HOME/.codestream/pubnub/Colin-CodeStream-Demo_Keyset
export CS_API_PUBNUB_PUBLISH_KEY=$PUBNUB_PUBLISH
export CS_API_PUBNUB_SUBSCRIBE_KEY=$PUBNUB_SUBSCRIBE
export CS_API_PUBNUB_SECRET=$PUBNUB_SECRET


export CS_API_MONGO_HOST=qm1.codestream.us
export CS_API_MONGO_PORT=27017
unset CS_API_SETUP_MONGO

# edit for production
# export CS_API_SSL_KEYFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-key
# export CS_API_SSL_CERTFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-crt
# export CS_API_SSL_CAFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-ca

export CS_API_PORT=8443
unset CS_API_LOG_CONSOLE_OK
export CS_API_REPLY_TO_DOMAIN=qa.codestream.com
