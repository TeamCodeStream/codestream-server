# CodeStream Broadcaster Service

This is a sample SocketCluster application for use with CodeStream
as a replacement for PubNub.

### Prerequisites
1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Install the [API service](https://github.com/teamcodestream/api_service).
1. Review how we manage our [server configurations](README.unified-cfg-file.md).
   This is especially important because the default configuration does not
   include the broadcaster service.

### Quick Start

1. Choose a sandbox name. We use `bc` as the default name for the sandbox and
   playground.

1. Since the default configuration is **codestream-cloud** and the broadcaster
   service isn't part of that configuration, if you configure everything using
   defaults this sandox will be **DOA** when loaded. This could be Ok. When you
   reconfigure your default configuration to **onprem-development** it will load
   fine.

   Assuming you're good with that behavior, install your sandbox with this command.
	```
	dt-sb-new-sandbox -yCD -t broadcast -n bc -e unified-cfg-file.sh
	```
   If, however, you'd prefer to always make the sandbox loadable you can install
   it with the `onprem.sh` sandbox configuration which will tell it to use the
   **onprem-development** codestream configuration, overriding your system
   default (`~/.codestream/config/codestream-cfg-default.local`).
	```
	dt-sb-new-sandbox -yCD -t broadcast -n bc -e onprem.sh
	```

1. Load your broadcaster sandbox in a new shell and create your `bc` playground
   file.
	```
	$ dt-load bc
	$ dt-sb-create-playground -n bc -t $CS_BROADCASTER_TOP/sandbox/playgrounds/default.template
	```
