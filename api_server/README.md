
# CodeStream API Service

The CodeStream API Service is home to the business logic, database management,
authentication layer and most other servier-side functions.

## Open-Core Development

The [repository's main README](../README.md) contains instructions for setting
up your sandbox and building all of the components outside the context of the
CodeStream dev_tools framework.

## Mono-Repo Development with the dev_tools Framework

Mono-Repo development using the dev_tools framework is documented
[here](../docs/codestream-sandbox-setup.md).

## Other In-Repo Documentation

* [Mono-Repo / Root-Level Documentation Index](../docs/README.md)
* [Supplemental API Documentation](docs/README.md)

## Component Sandbox Installation

These instructions are for installing the API as an independent component
sandbox. This is how installations are performed for our CI/CD pipelines.
### Prerequisites
1. Install the dev_tools toolkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Install mongo - this is available as a dev_tools sandbox or you can install
   any version. Instructions for the mongo sandbox are
   [here](https://github.com/teamcodestream/mongodb_tools).
1. Make sure you can access the CodeStream network via the VPN.
1. Review how we manage our versioned [server
   configurations](docs/unified-cfg-file.md). If you have any custom
   alterations to the standard configuration, you will need to be familiar with
   the procedures in this document.

### Quick Start
1. If you're using dev_tools on your own computer, bring it up to date
   (`dt-selfupdate -y`). You don't need to do this if you're using a managed EC2
   instance.
1. Update your secrets (`dt-dev-update-secrets -y`).
1. Select a codestream configuration to use. To get up and running quickly, this
   command will select out-of-the-box 'codestream-cloud' as your configuration.
	```
	echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
	```
1. Open a new terminal window
1. Choose a name for your mongo sandbox. The default is `mongo` (which this
   documentation will assume). Load your dev_tools mongo sandbox if you're using
   one and start the mongo service.
	```
	dt-load mongo
	mdb-service start
	```
   If using your own mongo installation, make sure it's running and accessible
   without credentials on **localhost** (the default mongo connect url is
   `mongodb://localhost/codestream`).
1. Install the api sandbox (only specify `--no-deps` if you are *not* using or
   have not loaded a dev_tools mongo sandbox). A default api sandbox name of
   `api` is assumed in some tools so we'll use it here (though you can change
   it).
   
   For private repo workflows:
   ```
   dt-sb-install --name api --type cs_server_nr --info-file sb.info.nr.api --yes [--no-deps]
   ```
   For working with the public repo as the origin:
   ```
   dt-sb-install --name api --type cs_server --info-file sb.info.tmp.api --yes [--no-deps]
   ```
1. Load your api sandbox:
	```
	dt-load api
	```
1. Create a playground for setting up future terminals with your mongo + api
   sandboxes. This will create one called `api`.
	```
	dt-sb-create-playground -t $CS_API_TOP/sandbox/playgrounds/default.template
	```
1. Install the [inbound email](../inbound_email/README.md), [outbound
   email](../outbound_email/README.md), [broadcaster](../broadcaster/README.md)
   & [onprem admin](../onprem_admin/README.md) sandboxes.
1. Load all of your sandboxes into one shell and create a `cs` playground for
   your codestream-cloud configuration.
	```
	dt-load mongo
	dt-load api
	dt-load mailin
	dt-load mailout
	dt-load opadm
	dt-load bc
	dt-sb-create-playground -t $CS_API_TOP/sandbox/playgrounds/cloud-dev.template
	```


## Common Commands

- To setup a new terminal's environment for the API
    ```
    dt-load-playground api [--start | --stop]
    ```
    optional **--start** will load the sandboxes and start the services.
	
	optional **--stop** will load the sandboxes and shutdown the services.

- To control the mongo service (if mongo is a sandbox):
	```
	mdb-service
	```

- To run the API in the foreground with one worker:
	```
	cd $CS_API_TOP
	bin/ensure-indexes.js
	bin/api_server.js --one_worker
	```

- To control the api service using the init script
	```
	cs_api-service
	```

- To see the api sandbox commands
	```
	cs_api-help
	```

- To see the api sandbox environment variables
	```
	cs_api-vars
	```

- To run the api_server with a debugger, add an `--inspect` argument before the
   executable .js file as such:
	```
	node --inspect bin/api_server.js --one_worker
	```
	or
	```
	nodemon -e js,hbs --inspect bin/api_server.js --one_worker
	```
	Then, in VS Code, run the `Node: Debugger` task. You'll want to attach to the process running on port `9230` when prompted.
