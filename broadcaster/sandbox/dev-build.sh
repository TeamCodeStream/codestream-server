

# This provides an environment for building the dev asset as
# well as running to support API sandboxes for other builds.

SSL_CERT_ROOT=/etc/pki
OTHER_SECRETS_FILE=$HOME/.codestream/codestream/dev-services
export CS_BROADCASTER_ASSET_ENV=dev
export CS_BROADCASTER_ENV=dev

. $CS_BROADCASTER_TOP/sandbox/defaults.sh
