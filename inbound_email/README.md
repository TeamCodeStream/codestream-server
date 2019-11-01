# CodeStream Inbound Email Gateway Service

This service processes CodeStream email replies, injecting them into the
system. It polls a directory so it relies on the email delivery agent
(eg. postfix) to save emails as individual files in a pre-determined location.

For local development, email is routed to a designated AWS instance and you must
run a script which will poll that instance and move the email to your local
sandbox. Two developers working on inbound email processing at the same time
would be stepping on one another.

## Installation for local cloud development using dev_tools

### Prerequisites
1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Install the [API service](https://github.com/teamcodestream/api_service).
1. Review how we manage our [server configurations](README.unified-cfg-file.md).

### Quick Start
1. Open a new terminal window
1. Choose a sandbox name and install the inbound email service (the default
   sandbox name we use here is `mailin`).
    ```
    $ dt-sb-new-sandbox -yCD -t cs_mailin -n mailin -e unified-cfg-file.sh
    ```
1. Load your sandbox
    ```
    $ dt-load mailin
    ```
1. Create a playground for your inbound mail service. This creates a
   playground called `mailin` which loads only the `mailin` sandbox.
    ```
    $ dt-sb-create-playground -t $CS_MAILIN_TOP/sandbox/playgrounds/default.template

Sandbox commands:

* *cs_mailin-help* will list all commands in the sandbox
* *cs_mailin-service* is the init script to start, stop and manage the inbound_email
  service.
* *cs_mailin-local-poller* is meant to run on a local development machine. It will
  poll the inbound cloud mail server for new messages and copy them to your local
  queue. Be aware that this does not support more than one developer using a
  mail server.
