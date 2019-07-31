# CodeStream Broadcaster Service

This is a sample SocketCluster application for use with CodeStream
as a replacement for PubNub.

### Prerequisites

1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).

1. Make sure you can access the CodeStream network via the VPN.

1. Review the procedure for managing the [unified config
   file](https://github.com/TeamCodeStream/api_server/blob/develop/README.unified-cfg-file.md)
   and set your config to **local-onprem-development.json**

### Quick Start

1. Install the broadcaster sandbox
	```
	dt-sb-new-sandbox -yCD -t broadcast -n <your-broadcaster-sandbox-name> [-e unified-cfg-file.sh -b config_update]
	```

1. Load your broadcaster sandbox:
	```
	$ dt-load <your-broadcaster-sandbox-name>
	```

1. Create a playground dedicated the broadcaster for setting up future shell
   sessions.
	```
	$ dt-sb-create-playground -n <your-broadcaster-playground-name> -t $CS_BROADCASTER_TOP/sandbox/playgrounds/default.template
	```

