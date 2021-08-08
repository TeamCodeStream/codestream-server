# Documentation Index

The codestream-server mono-repo contains all of the individual compoenents for
the server-side codestream services. While the mono-repo is used for
development, the CI/CD pipelines build, manage & deploy the components
independently. The mono-repo is never built or installed anywhere outside of
local development.

Much of the in-repo documentation can be found within the individual components'
docs directories (links below). Further, some of the docs reference sites on the
codestream development network. These links will not work outside of that
context.

## Mono-Repo Supplemental Documentation
* [Mono-Repo Development with the dev_tools Framework](codestream-sandbox-setup.md) -
  Installation of codestream-server services using the CodeStream dev_tools
  framework.

* [Code Of Conduct](code-of-conduct.md) - Our ethics, standards, processes and
  code of conduct.

## Server Components

* [API](../api_server/README.md) - By far the largest component containing all
  of the business logic, data models and access layer to the database.
  Supplemental API docs can be found [here](../api_server/docs/README.md).

* [Broadcaster](../broadcaster/README.md) - For On-Prem deployments, the
  broadcaster handles instant messaging communications between clients and the
  server utilizing the socketcluster.io library. Supplemental broadcaster docs
  can be found [here](../broadcaster/docs/README.md).

* [Outbound Email](../outbound_email/README.md) - The API is responsible
  for determining what email should be sent and queuing up requests accordingly.
  It uses AWS SQS for CodeStream Cloud and RabbitMQ for CodeStream On-Prem. The
  Outbound Email service de-queues the requests and processes them. For
  CodeStream Cloud, we use the SendGrid.com service. On-Prem installations can
  use SendGrid or any standard SMTP relay (via NodeMailer). Supplemental
  outbound email docs can be found [here](../outbound_email/docs/README.md).

* [Inbound Email](../inbound_email/README.md) - Inbound email servers
  running **postfix** receive inbound SMTP connections and write the messages to
  queues (files on the filesystem) which the inbound email service processes.
  The inbound email service verifies the messages and injects into CodeStream by
  way of making API calls. Supplemental inbound email docs can be found
  [here](../inbound_email/docs/README.md).

* [On-Prem Admin](../onprem_admin/README.md) - An admin server and browser
  Single Page App for editing the configuration, monitoring the services and
  performing other maintenance functions for On-Prem installations. Supplemental
  onprem admin docs can be found [here](../onprem_admin/docs/README.md).
