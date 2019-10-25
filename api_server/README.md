
# CodeStream API Service

The CodeStream API Service is lovely.


## Installation for local cloud development using dev_tools

### Prerequisites
1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Install mongo - this is available as a dev_tools sandbox or you can install
   any version. Instructions for the mongo sandbox are
   [here](https://github.com/teamcodestream/mongodb_tools).
1. Make sure you can access the CodeStream network via the VPN.
1. Review how we manage our [server configurations](README.unified-cfg-file.md).
   If you have any custom alterations to the standard configuration, you will
   need to be familiar with the procedures in this document.

### Quick Start
1. If you're using dev_tools on your own computer, bring it up to date
   (`dt-selfupdate -y`).
1. Update your secrets (`dt-update-secrets`).
1. Select a codestream configuration to use (details documented
   [here](README.unified-cfg-file.md)). To get up and running quickly, this will
   select out-of-the-box 'codestream-cloud' as your configuration.
	```
	$ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
	```
1. Open a new terminal window
1. Load your dev_tools mongo sandbox if you're using one and start the mongo service.
	```
	$ dt-load <my-mongo-sandbox-name>
	$ mdb-service start
	```
    If using your own mongo installation, make sure it's running and accessible
    without credentials on **localhost**.
1. Install the api sandbox (only specify `-I` if you are *not* using or have not
   loaded a dev_tools mongo sandbox). We're migrating to a new unified config
   file format so for now include the `-e` and `-b` options.
	```
	dt-sb-new-sandbox -yCD [-I] -t cs_api -n <your-api-sandbox-name> -e unified-cfg-file.sh
	```
1. Load your api sandbox:
	```
	$ dt-load <your-api-sandbox-name>
	```
1. Create a playground for setting up future terminals with your mongo + api
   sandboxes:
	```
	$ dt-sb-create-playground -t $CS_API_TOP/sandbox/playgrounds/default.template
	```
	or
	```
	$ dt-sb-create-playground -n <custom-playground-name> -t $CS_API_TOP/sandbox/playgrounds/default.template
	```
   There are other playground templates you may find useful in $CS_API_TOP/sandbox/playgrounds/.


## Common Commands

- To setup a new terminal's environment for the API
    ```
    $ dt-load-playground <your-api-playground-name> [--start | --stop]
    ```
    optional **--start** will load the sandboxes and start the services.
	
	optional **--stop** will load the sandboxes and shutdown the services.

- To control the mongo service (if mongo is a sandbox):
	```
	$ mdb-service
	```

- To run the API in the foreground with one worker:
	```
	$ cd $CS_API_TOP
	$ bin/ensure-indexes.js
	$ bin/api_server.js --one_worker
	```

- To control the api service using the init script
	```
	$ cs_api-service
	```

- To see the api sandbox commands
	```
	$ cs_api-help
	```

- To see the api sandbox environment variables
	```
	$ cs_api-vars
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


## Other Readme's

[The unified configuration file](README.unified-cfg-file.md)
<br>
[OnPrem development configuration](README.onprem-development.md)
