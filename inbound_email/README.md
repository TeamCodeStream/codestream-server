# CodeStream Inbound Email Gateway Service

This service processes replies to CodeStream generated emails and injects them
back into the system. This service expects the inbound emails to be dropped
into a designated directory by a standard email service (such as postfix).

Full instructions for setting this sandbox up, along with others needed to
complete the codestream development environment can be found with the API
service documentation.


## Installation for local cloud development using dev_tools

### Prerequisites
1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Install the [API service](https://github.com/teamcodestream/api_service).
1. Review the procedure for managing the [unified config
   file](README.unified-cfg-file.md) and set your config to
   **local-cloud-development.json**

### Quick Start
1. Open a new terminal window
1. Install the inbound email service
    ```
    $ dt-sb-new-sandbox -yCD -t cs_mailin -n <sandbox-name>
    ```
1. Load your sandbox
    ```
    $ dt-load <sandbox-name>
    ```
1. Create a playground for your inbound mail service
    ```
    $ dt-sb-create-playground -n <mailin-playground-name> -t $CS_MAILIN_TOP/sandbox/playgrounds/default.template

Sandbox commands:

* *cs_mailin-help* will list all commands in the sandbox
* *cs_mailin-service* is the init script to start, stop and manage the inbound_email
  service.
* *cs_mailin-local-poller* is meant to run on a local development machine. It will
  poll the inbound cloud mail server for new messages and copy them to your local
  queue. Be aware that this does not support more than one developer using a
  mail server.
