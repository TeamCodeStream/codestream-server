# CodeStream Backend Services

**This covers codestream-server development as a mono-repo (all services running
in one sandbox) using the devtools framework.** There are other ways to do this,
such as the open development instructions in the main README, however you won't
have access to the features and conveniences applicable to the CodeStream
network. It's worth noting that our CI/CD pipelines do not use the mono-repo
configuration; they install component sandboxes (api, broadcaster, ...) from the
mono-repo.

codestream-services incorporates a number of services to provide all the
functionality needed for the clients. Which services to run and their
configurations differ based on cloud v. on-prem, and those can be further broken
down into a number of installation or product types. Accordingly, the mono-repo
offers two configurations; **default.sh** for cloud development, and the aptly
named **onprem-development.sh**.

The two sandbox configurations use these services:

| Sandbox Config | Services |
| --- | --- |
| default.sh (cloud) | mongodb, aws sqs, api, pubnub, mailin, mailout |
| onprem-development.sh | mongodb, rabbitmq, api, broadcaster, mailout, admin |

Note that MongoDB, RabbitMQ & AWS SQS are outside the scope of a
codestream-server sandbox. We do have a mongo sandbox that can be used together
with the codestream-server sandbox in a playground. AWS SQS requires an AWS IAM
access key or the codestream-server sandbox to run on a managed EC2 development
instance.

## Installation

Probably the fastest way to get started would be by launching your own private
development VM and running a setup script that will prepare your entire
environment for server development. [This is documented
here](https://dtops-docs.codestream.us/netuser/resources/dev-vms/).

## Installation & Setup Using the dev_tools Framework

Installation for development on the CodeStream network using the devtools
framework.

### Prerequisites
1. Install the dev_tools toolkit
   [here](https://github.com/teamcodestream/dev_tools) if you aren't running
   your sandbox on a development VM.
1. Install the mongo sandbox. Instructions can be found
   [here](https://github.com/teamcodestream/mongodb_tools).
1. For cloud development, ensure you can access the AWS SQS service. If running
   your sandbox on your own computer, you'll need an AWS IAM API key with
   **Remote Development** access. Email **ops@codestream.com** for that.
1. For on-prem development, you'll need rabbitMQ. To run the pre-configured
   docker container, run:
   ```
   docker run -d -p 5672:5672 -p 15672:15672 --name csrabbitmq teamcodestream/rabbitmq-onprem:0.0.0
   ```
1. Review how we manage our [server configurations](../api_server/docs/unified-cfg-file.md).
   If you have any custom alterations to the standard configuration, you will
   need to be familiar with the procedures in this document.

### Quick and Dirty 

The framework includes an installation script that does all the work. If you
don't have the framework installed on your notebook, you could spin up a
development instance for yourself. [This is documented
here](https://dtops-docs.codestream.us/netuser/resources/dev-vms/).

This will install all the codestream sandboxes including the front-end client
repo, onprem-install and backend repos.
```
dt-dev-setup --codestream
```

### Installation & Setup Using dev_tools Framework commands

This is _mostly_ what the **dt-dev-setup** script will do, but reduced to the
sandboxes applicable solely to the CodeStream Back-End services.

1. Update your secrets (`dt-update-secrets -y`).
1. Select a codestream configuration to use (details documented
   [here](../api_server/docs/unified-cfg-file.md)). To get up and running quickly, this
   command will select out-of-the-box 'codestream-cloud' as your configuration.
	```
	echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
	```
1. Open a new terminal window, without any sandboxes loaded.
1. If you're using a mongo sandbox, load it into your shell.
	```
	dt-load mongo
	mdb-service start
	```
   If using your own mongo installation, make sure it's running and accessible
   without credentials on **localhost**. The default mongo connect url assumes
   `mongodb://localhost/codestream`.
1. Install the codestream-server repo. Select a name for your backend sandbox
   (we'll use `csbe`). If you want your sandbox initally configured for onprem
   development, include `-e onprem-development.sh` to this command:
	```
   dt-sb-install --name csbe --type cs_server --info-file sb.info.nr --yes
	```
1. Load your codestream backend sandbox:
	```
	dt-load csbe
	```
1. If you're using a mongo sandbox, create a playground for setting up future
   terminals with your mongo + csbe sandboxes. This will create a playground
   with a default name of `csbe` (not to be confused with the **csbe** sandbox).
	```
	dt-sb-create-playground -t $CSBE_TOP/sandbox/playgrounds/default.template
	```

You are ready to go.  From this point forward use the following command to setup
new shells for codestream backend development:
```
dt-load-playground csbe
```
You are good to go.

## Loading the Playground

1. In a new shell, load the backend playground with the command
   `dt-load-playground csbe` or `dlp csbe`. This sets your shell up with the
   mongo and backend server mono-repo sandboxes. Run `dt-env` to see them.

1. Control mongo with the `mdb-service` command
   ```
   mdb-service { start | stop | status }
   ```

1. See the backend mono-repo commands with `csbe-help`. Since the mono-repo
   effectively loads all the component sandboxes (api, mailout, mailin,
   broadcaster, onprem-admin), all of those commands are available as well. Use
   `cs_api-help`, `cs_outbound_email-help`, `cs_mailin-help`,
   `cs_broadcaster-help` and `opadm-help`.

Happy coding!.
