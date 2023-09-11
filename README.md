# CodeStream Backend Services

On the backend (aka. the server-side), CodeStream runs a number of services to
provide all the functionality needed for the clients. The default development
environment will use the codestream broadcaster and rabbitMQ with outbound mail
disabled.

## Development Setup with the devtools Framework

_Note: CodeStream employees should use the dev_tools sandbox as it will provide
most of the ancillary resources you'll need, most notably our development
configuration which includes secrets for pubnub, integration providers, etc...
Details [here](docs/codestream-sandbox-setup.md). Supplemental documentation is
[here](docs/README.md)._

## Development Setup with docker-compose

## Development Setup

### Prerequisites

1. Mac or Linux computer using zsh or bash.

1. [Docker Desktop](https://www.docker.com/products/docker-desktop) which we'll
   use to provide MongoDB.

### Installation

For local development we use docker compose to only run mongodb. You will need to run the
api-server locally via your IDE or command lne.

1. Clone the [codestream-server](https://github.com/teamcodestream/codestream-server) repo.

1. Start up the docker container for MongoDB via docker compose.
   ```
   docker compose up mongodb -d
   ```
1. Install dependencies
   ```
   npm run install:all
   ```

1. Make sure you are authenticated with vault

1. Source the secrets into your current shell
   ```
   . ./devSecrets.sh
   ```

1. Setup and start up the api-server without docker
   ```
    ./start-api-server.sh
   ```

Point your CodeStream extension to https://localhost.codestream.us:12079. You should be able to
login and see o11y.

Develop to your heart's content!!!!  We _love_ pull-requests.

## Run everything in docker

If you want to just run the api_server locally with fewer commands.

1. Make sure you are logged into vault

1. Source the secrets into your current shell
   ```
   . ./devSecrets.sh
   ```
1. Start docker compose
   ```
   docker compose up
   ```

## Dev cert management

To trust the self-signing dev CA on macos, run:

   ```
   sudo security add-trusted-cert \
     -d \
     -r trustRoot \
     -k /Library/Keychains/System.keychain \
     certs/codestream-dev.crt
   ```


Self signed certs were created with the amazing [certstrap](https://github.com/square/certstrap).
Tool which is available via `brew install certstrap`. The certs were created using the following process:

1. Create a certificate authority

   ```
   certstrap init --common-name "codestream-dev"
   ```
1. Request a cert

   ```
   certstrap request-cert --common-name localhost.codestream.us --domain '*.codestream.us','localhost','*.localhost'
   ```
1. Sign the cert with the certificate authority from step 1

   ```
   certstrap sign localhost.codestream.us --CA codestream-dev
   ```

Once the certificacte authority is trusted any self signed certs created from
that certificate authority will be accepted. If we need to add any more local
dev certs, just repeat step 2 and 3.
