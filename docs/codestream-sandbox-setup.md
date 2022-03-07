# CodeStream Backend Services

**This covers codestream-server development configured as a mono-repo (all
services running in one sandbox) using the devtools framework.** There are other
ways to do this, such as the open development instructions in the main README,
however you won't have access to the features and conveniences applicable to the
CodeStream network. It's worth noting that our CI/CD pipelines do not use the
mono-repo configuration; they build and install component sandboxes separately
(api, broadcaster, ...).

* [Quick Installations (TL;DR)](#quick-installations)
* [Quick Starts (TL;DR)](#quick-starts)
* [Configurations (more detail)](#configurations-primer)


## Quick Installations

These quick starts get your mongo and codestream server sandbboxes up and
running in several configurations. It assumes you have no customizations of your
configuration files (or haven't installed them yet) and already have the
dev_tools framework installed. They also assume you're ok using all the default
settings and naming conventions.

A few things to know:

* We use a mono-repo configuration for development where each of the component
  services (api, mailin, mailout, ...) run inside a single sandbox.

* Development CodeSteam configurations are prepared and distributed by ops. This
  includes all keys, tokens and secrets you'll need to develop integrations. The
  out-of-the-box default configuration name is `codestream-cloud-custom-1`.

* For sandboxes & playgrounds to co-exist on the same system in development,
  you'll need to use different run-time environments. All you need to know for
  now is that you'll see 3 of them.
   * `local` is used for a single, standalone backend service.
   * `local1` is for one half of a dual-environment backend service.
   * `local2` is for the other half of a dual-environment backend service.

### Uber-Fast Installation for a stand-alone backend

This installs **mongo**, **csbe** (codestream backend) and **csfe** (codestream
frontend) sandboxes and corresponding playgrounds. The **csfe** sandbox is
beyond the scope of this document and not really needed here, but you get it for
free with this uber-easy installer.

```
dt-dev-setup --codestream
```

If that worked you have installed three new sandboxes and playgrounds. The
**csbe** sandbox is configured to use the **local** run-time environment.
Continue with the [Quick Starts](#quick-starts) section for loading playgrounds
and starting services.


### Uber-Fast Installation for dual-environment backend services

In this configuration, you're creating two new playgrounds. As a prerequisite,
you need to complete the uber-fast stand-alone backend installation above. This
installs two additional sandboxes & playgrounds; **csbe-local1** and
**csbe-local2**.

```
dt-dev-setup --codestream-dual
```

The two additional playgrounds can co-exist on the same system with the
stand-alone playground, but each requires its own shell. Continue with the
[Quick Starts](#quick-starts) section for loading playgrounds and starting
services.

## Quick Starts

Now that you've got your server configurations, secrets and sandboxes installed,
let's put them to use.

### Startup your stand-alone backend services

Note that these instructions have you run your backend services in the
background. You probably won't do that during development but the aim of this
document is just to get you started.

Load your **csbe** playground (which consists of your mongo and csbe
sandboxes) and start the services.
```
dlp csbe            # dlp is an alias for dt-load-playground
mdb-service start   # start mongo
csbe-service start  # start the component services (api, mailout, mailin, ...)
```

Properties to be aware of:

| property | desc |
| --- | --- |
| CSSVC_ENV | The run-time environments `local*` are reserved for development. The CodeStream development platform knows about this environment and is able to provide additional resources based on it. For example, interactive callbacks from Slack can be routed to your sandbox via the CodeStream proxies. |
| CSSVC_CFG_FILE | When you load your sandbox, this variable will be defined to point to the appropriate codestream services configuration file. |
| api URL | `https://localhost.codestream.us:12079` for development on your personal computer<br>`https://<my-server>.codestream.us:12079` for development on your own VM |
| mongo URL | `mongodb://localhost/codestream` for development on your personal computer<br>`mongodb://<my-server>.codestream.us/codestream` for development on your own VM |


### Startup your dual-environment backend sandboxes

This is pretty much identical to the previous section except your playgrounds
are **csbe-local1** and **csbe-local2** respectively.

In a new shell:
```
dlp csbe-local1
```

In a different new shell:
```
dlp csbe-local2
```

The commands are the same in all sandboxes. The different properties are:

| property | desc |
| --- | --- |
| CSSVC_ENV=local | The run-time environments `local*` are reserved for development. The CodeStream development platform knows about this environment and is able to provide effective resources based on it. |
| CSSVC_CFG_FILE | When you load your sandbox, this variable will be defined to point to the appropriate codestream services configuration file. |
| api URL (local1) | `https://localhost.codestream.us:13079` for development on your personal computer<br>`https://<my-server>.codestream.us:13079` for development on your own VM |
| api URL (local2) | `https://localhost.codestream.us:13080` for development on your personal computer<br>`https://<my-server>.codestream.us:13080` for development on your own VM |
| mongo URL | `mongodb://localhost/codestream-local1` for **csbe-local1**<br>`mongodb://localhost/codestream-local1` for **csbe-local2** |


### Just a Bit More

#### Sandbox Commands

Sandboxes have well-defined interfaces. Once loaded, you'll find many tasks are
similar in how to approach them.

To control the mongo service, use the `mdb-service` command.
```
mdb-service { start | stop | status }
```

To control the csbe services, use the `csbe-service` command (though you probably won't do this much).
```
csbe-service { start | stop | status }
```

The **csbe** and **csbe-localN** sandboxes are based on a mono-repo
(codestream-server). Inside them, the individual component sandboxes are still
there, though they don't appear as their own sandbox entity (kind of confusing
for a newbie - don't worry about it).

Just think of **csbe** and a superset of a number of other sandboxes. For
example, you have commands and services for these components. In our CI/CD
pipelines and in production environments, these exist as their own sandboxes but
in the **csbe** sandbox, you can still run these commands.

* api - `cs_api-*`
* mailout - `cs_outbound-email-*`
* mailin - `cs_mailin-*`

In addition to the `<prefix>-service` command, all sandboxes support these
standard commands as well (plus many others).

* `<prefix>-help` - quick list of sandbox commands
* `<prefix>-vars` - show environment variables in the sandbox

#### Integrations

Some integrations require callbacks from 3rd party vendor sites (eg. Slack). We
have a public-facing proxy service which has a mechanism for proxying
pre-determined requests from these 3rd party services to your _primary
development VM_. You will need this, for example, if you're doing development
work on the Slack integration using their interactive components feature. The
mechanism uses DNS so each developer can designate one of their development VMs
at a time to be a _primary_, which would receive these proxy requets.

Use the `dt-dev-set-primary` script to set your primary. You can change it at
any time. _This does not work for development on your local computer; only on
network VMs._


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
| local1.sh (dual-env cloud) | mongodb, aws sqs, api, pubnub, mailin, mailout |
| local2.sh (dual-env cloud) | mongodb, aws sqs, api, pubnub, mailin, mailout |
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

Happy coding!.
