# CodeStream Backend Services

**This covers codestream-server development configured as a mono-repo (all
services running in one sandbox) using the devtools framework.** There are other
ways to do this, such as the open development instructions in the main README,
however you won't have access to the features and conveniences applicable to the
CodeStream network. It's worth noting that our CI/CD pipelines do not use the
mono-repo configuration; they install component sandboxes (api, broadcaster,
...) from the mono-repo.

* [Quick Start (TL;DIR)](#quick-start)
* [Configurations](#configurations-primer)
* [Installation](#installation)
* [Load the Playground](#loading-the-playground)


## Quick Start

Assuming you have a mono-repo playground installation ready to go, this should
work.

1. Login to your development host and load your codestream-server backend
   playground (`dt-load-playground csbe` or `dlp csbe`). Now your shell
   (terminal) environment has been setup to run these services.

1. This playground consists of two sandboxes; a mongo server, called _mongo_,
   and the codestream-server component services (api, mailin, mailout, ...)
   aggregated into a single sandbox, called _csbe_. It's worth mentioning this
   is differnt from how they're managed and installed in our CI/CD pipelines,
   where each component is installed, packaged and deployed on its own.

   `dt-env` will report the sandboxes that have been loaded into your shell.

1. Each sandbox has a _prefix_ associated with it. As the **csbe** sandbox is an
   aggregate of the component services (a mono-repo sandbox), loading it sets up
   the shell environment for all of the component services as well (even though
   `dt-env` reports only the aggregate, mono-repo, sandbox is loaded).

   | service | command prefix |
   | --- | --- |
   | mongo | mdb |
   | codestream-server mono-repo | csbe |
   | codestream api | cs_api |
   | codestream broadcaster | cs_broadcaster |
   | codestream inbound email | cs_mailin |
   | codestream outbound emailer | cs_outbound_email |

   For each service, you can run `{cmd-prefix}-help` to see all the commands in
   that sandbox.

   Environment variables use the prefix as a kind of namespace as well, with
   mongo sandbox variables all beginning with `MDB_`. You can see a sandbox's
   environment variables with `{cmd-prefix}-vars`.

1. For each sandbox, there's a service init script, `{cmd-prefix}-service`. They
   take an initial argument of _start_ | _stop_ | _status_. So if you wanted to
   start the API, you need to start two services; mongo and the api.
   ```
   mdb-service start
   cs_api-service start
   ```

1. Once you get going, it won't be long before you want to customize your
   codestream server configuration. [Read as part of your quick start
   lesson.](#cusomizing-you-codestream-configurations)

1. Some integrations require callbacks from 3rd party vendor sites (eg. Slack).
   We have a public-facing proxy service which has a mechanism for proxying
   pre-determined requests from these 3rd party services to your _primary
   development VM_. You will need this, for example, if you're doing development
   work on the Slack integration using their interactive components feature. The
   mechanism uses DNS so each developer can designate one of their development
   VMs at a time to be a _primary_, which would receive these proxy requets.

   Use the `dt-dev-set-primary` script to set your primary. You can change it at
   any time.


## Configurations Primer

The _sandbox configuration_ dictates how the shell environment is set each time
you load your codestream-server sandbox. The _CodeStream configuration_ is
loaded by CodeStream services upon launch and controls how the services behave.
### Sandbox Configurations

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

### CodeStream Configurations

The CodeStream services (api, outbound email, inbound email, etc...) share a
common configuration file. The config file uses a versioned schema to adapt to
changes over time in the code base.

A detailed explanation of the CodeStream server configuration file management
(not its content) is [here](../api_server/docs/unified-cfg-file.md) but the next
section covers how to customize it to your liking.

#### Cusomizing You CodeStream Configurations

Your codestream configuration files are located in **~/.codestream/config/**.

* The `dt-dev-setup` installation script will set you up with a configuration
  called **codestream-cloud-custom-1** that's got an overrides file,
  **custom-overides-for-custom-1.json**, which contains an empty json object.

* Each time you fetch updated secrets using the `dt-dev-update-secrets` command, a
  _hook_ will create your custom config (**codestream-cloud-custom-1**) by taking
  the distributed config **codestream-cloud** and updating it with your
  **custom-overides-for-custom-1.json** data (python obj.update() or JS
  obj.assign()).

* Add any overrides data you want in your config to
  **custom-overrides-for-custom-1.json** file. There's an example file for
  reference in that directory as well (\*.example).


## Installation

The fastest way to get started would be by launching your own private
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

1. Update your secrets (`dt-dev-update-secrets -y`).
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
