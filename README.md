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

1. Make sure you are authenticated with vault!, i.e.

  `newrelic-vault us login -method=okta username=<username> totp=<otp>`

1. If you plan to enable outbound email, make sure you have a working
   AWS session to the CodeStream development account. If this requires
   use of the `AWS_*` environment variables and you plan to launch from
   the debugger, ensure they're defined in the appropriate block in
   `.vscode/launch.json`.

### Installation

For local development we use docker compose to only run mongodb. You will need to run the 
api-server locally via your IDE or command line.

1. Clone and setup
   [faker-service-gateway](https://source.datanerd.us/codestream/faker-service-gateway).
   Faker service gateway will handle SSL and proxy requests to the api-server.

1. Clone the [codestream-server](https://github.com/teamcodestream/codestream-server) repo.

1. Start up the docker container for MongoDB via docker compose.
   ```
   docker compose up mongodb -d
   ```
1. Install dependencies
   ```
   npm run install:all
   ```

### Method 1 - launch from shell and run natively

1. Setup and start up the api-server without docker. The default
   behavior is to initialize the database and disable outbound
   email queueing.
   ```
   ./start-api-server.sh [-init-db-only | -no-db | -enable-mailout ]
   ```

### Method 2 - launch from IDE

1. Review the pre-reqs above to ensure you set any additional vars
   needed for your use case.  `.vscode/launch.json` has some comments
   to help.

1. Select any of the the `api_srv.js` run configurations from vscode or
   jetbrains.

Point your CodeStream extension to https://localhost.newrelic.com:12079. You
should be able to login and see o11y.

Develop to your heart's content!!!!  We _love_ pull-requests.

## Run everything in docker

Not working right now :(. Check back later.
