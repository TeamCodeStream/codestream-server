# CodeStream Backend Services

On the backend, CodeStream requires several services to provide all the
functionality needed for the clients. Different configurations are supported
most natably the use of the broadcaster and rabbitMQ for On-Prem vs. PubNub and
AWS SQS for CodeStream Cloud. This repo contains all the code for these
services.

## Installation & Setup Using dev_tools

Installation for development on the CodeStream network.

### Prerequisites
1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Install mongo - this is available as a dev_tools sandbox or you can install
   any version. Instructions for the mongo sandbox are
   [here](https://github.com/teamcodestream/mongodb_tools).
1. Make sure you can access the CodeStream network via the VPN.
1. Review how we manage our [server configurations](api_server/README.unified-cfg-file.md).
   If you have any custom alterations to the standard configuration, you will
   need to be familiar with the procedures in this document.

### Installation
1. If you're using dev_tools on your own computer, bring it up to date
   (`dt-selfupdate -y`). You don't need to do this if you're using a managed EC2
   instance.
1. Update your secrets (`dt-update-secrets -y`).
1. Select a codestream configuration to use (details documented
   [here](README.unified-cfg-file.md)). To get up and running quickly, this
   command will select out-of-the-box 'codestream-cloud' as your configuration.
	```
	$ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
	```
1. Open a new terminal window
1. Load your dev_tools mongo sandbox into your shell if you're using one and
   start the mongo service.
	```
	$ dt-load mongo
	$ mdb-service start
	```
   If using your own mongo installation, make sure it's running and accessible
   without credentials on **localhost** (the default mongo connect url assumes
   `mongodb://localhost/codestream`).
1. Install the codestream-server repo (only specify `-I` if you are *not* using
   or have not loaded a dev_tools mongo sandbox). Select a name for your backend
   sandbox (we'll use `csbe`):
	```
	dt-sb-new-sandbox -yCD -t cs_server -n csbe
	```
1. Load your codestream backend sandbox:
	```
	$ dt-load csbe
	```
1. Create a playground for setting up future terminals with your mongo + csbe
   sandboxes. This will create a playground with a default name of `csbe` (not
   to be confused with the **csbe** sandbox).
	```
	$ dt-sb-create-playground -t $CSBE_TOP/sandbox/playgrounds/default.template
	```

You are ready to go.  From this point forward use the following command to setup
new shells for codestream backend development:
```
$ dt-load-playground csbe
```

