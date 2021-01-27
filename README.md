# CodeStream Backend Services

On the backend (aka. the server-side), CodeStream runs a number of services to
provide all the functionality needed for the clients. The default development
environment will use the codestream broadcaster and rabbitMQ. Mail services
are disabled by default.
## Development Setup

_Note: CodeStream employees may prefer to use the dev_tools sandbox as it will
provide most of the ancillary resources you'll need. [Details
here](docs/codestream-sandbox-setup.md)._

### Prerequisites

1. Mac or Linux computer using zsh or bash.

1. Official CodeStream builds (CI) use Nodejs 12.14.1 with npm 6.13.4

1. [Docker Desktop](https://www.docker.com/products/docker-desktop) which we'll
   use to provide MongoDB and a pre-configured RabbitMQ.

If you do not wish to use docker, you'll need to provide both of these services:

1. MongoDB 3.4.9 with `mongodb://localhost/codestream` providing full access to
   create collections and indexes in the `codestream` database. If you're
   willing to run docker, the instructions below will show you how to install a
   MongoDB docker container.

1. RabbitMQ 3.7.x with the delayed message exchange plugin. You'll also need to
   create a codestream user with access. [Notes here](api_server/docs/rabbitmq.md).

### Installation

1. Fork the
   [codestream-server](https://github.com/teamcodestream/codestream-server) repo
   and clone it.

1. Setup your shell's environment
   ```
   cd codestream-server
   source dev-env.sh     # custom settings go in .sandbox-config.sh
   ```

1. Install all the node modules
   ```
   npm run install:all
   ```

1. Install the rabbitmq docker container pre-configured for codestream (the
   container name will be csrabbitmq)
   ```
   npm run run:docker:csrabbitmq
   ```

1. Create a docker volume for mongo and launch the mongodb docker container.
   The docker volume will ensure the data persists beyond the lifespan of the
   container.
   ```
   npm run run:docker:csmongo
   ```

1. In a separate shell, source in the `dev-env.sh` environment and start up the
   api service. It will repeatedly try to connect to the broadcaster. That's ok.
   Move on once you've started it.
   ```
   source dev-env.sh
   npm run start:api
   ```

1. In a another separate shell, source in the `dev-env.sh` environment and start
   up the broadcaster service.
   ```
   source dev-env.sh
   npm run start:broadcaster
   ```

1. If you want to use or work on the onprem admin UI, that will need two more
   shells. This first one will run webpack and rebuild the bundle file as your
   files change.
   ```
   source dev-env.sh
   npm run start:opadm
   ```

1. The inbound email service is disabled in the default config.
   ```
   source dev-env.sh
   npm run start:mailin
   ```

1. The outbound email service is also disabled in the default config.
   ```
   source dev-env.sh
   npm run start:mailout
   ```

Point your CodeStream extension to http://localhost:12000. You should be able to
register and create codemarks. The onprem admin console is at http://localhost:12002

Develop to your heart's content!!!!  We _love_ pull-requests.
