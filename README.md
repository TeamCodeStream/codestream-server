# CodeStream Backend Services

On the backend (aka. the server-side), CodeStream runs a number of services to
provide all the functionality needed for the clients. The default development
environment will use the codestream broadcaster with outbound mail
disabled.

## Development Setup with docker-compose

## Development Setup

### Prerequisites

1. Mac or Linux computer using zsh or bash.

1. [Docker Desktop](https://www.docker.com/products/docker-desktop) which we'll
   use to provide MongoDB.

### Installation

For local development we use docker compose to only run mongodb. You will need to run the 
api-server locally via your IDE or command line.

1. Clone and setup [faker-service-gateway](https://source.datanerd.us/codestream/faker-service-gateway). Faker service gateway will handle SSL and proxy requests to the api-server. 

1. Clone the [codestream-server](https://github.com/teamcodestream/codestream-server) repo.

1. Start up the docker container for MongoDB via docker compose.
   ```
   docker compose up mongodb -d
   ```
1. Install dependencies
   ```
   npm run install:all
   ```

1. Make sure you are authenticated with vault!, i.e.
  
  `newrelic-vault us login -method=okta username=<username> totp=<otp>`

### Method 1 - launch from shell

1. Source the secrets into your current shell
   ```
   . ./devSecrets.sh
   ```

1. Setup and start up the api-server without docker
   ```
    ./start-api-server.sh
   ```

### Method 2 - launch from IDE

1. Run the `api_server.js local` run config from vscode or jetbrains

Point your CodeStream extension to https://localhost.newrelic.com:12079. You should be 
able to login and see o11y. 

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
