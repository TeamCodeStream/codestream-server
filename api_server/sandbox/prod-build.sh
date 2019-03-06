
# This provides an environment for building the prod asset as
# well as running supporting API sandboxes for other builds.

# These secrets are not part of the assets - only used for testing
PUBNUB_KEY_FILE="$HOME/.codestream/pubnub/CodeStream-Development-CI_Keyset"
OTHER_SECRETS_FILE="$HOME/.codestream/codestream/ci-api"

export CS_API_ASSET_ENV=prod

# This variable can be overridden when the sandbox is installed
export CS_API_PORT=37201

. $CS_API_TOP/sandbox/defaults.sh

export CS_API_REPLY_TO_DOMAIN=ci.codestream.com
export CS_API_OUTBOUND_EMAIL_SQS="ci_outboundEmail"
export CS_API_SENDER_EMAIL=ci-alerts@codestream.com

# These are fake ports
export CS_API_WEB_CLIENT_ORIGIN=http://localhost.codestream.us:37204
export CS_API_PUBLIC_URL=https://localhost.codestream.us:37205
