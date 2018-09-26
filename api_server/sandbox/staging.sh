
. $CS_API_TOP/sandbox/defaults.sh

export CS_API_SSL_KEYFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-key
export CS_API_SSL_CERTFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-crt
export CS_API_SSL_CAFILE=/etc/pki/wildcard.codestream.us/wildcard.codestream.us-ca
export CS_API_PORT=9443
export CS_API_LOG_CONSOLE_OK=
export CS_API_REPLY_TO_DOMAIN=staging.codestream.com
export CS_API_WEB_CLIENT_ORIGIN=https://stage-app.codestream.us
unset CS_API_SUPPRESS_EMAILS
