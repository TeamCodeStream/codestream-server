
# CodeStream API Service

The CodeStream API Service is lovely.


## Installation (or major upgrade) for local development as a dev_tools sandbox

### Prerequisites
1. Install the dev_tools tookkit [here](https://github.com/teamcodestream/dev_tools).
1. Install mongo - this is available as a dev_tools sandbox. Instructions are [here](https://github.com/teamcodestream/mongodb_tools).
1. Access to the CodeStream network via the VPN

### Commands
1. If your intention is to do a major upgrade of your existing sandbox (because you cannot afford to loose your
local repository), in a clean shell (no sandboxes loaded), run this command:
	```
	mv ~/sandboxes/$my_api_sandbox_name ~/sandboxes/$my_api_sandbox_name.ORIG
	```
1. Open a new terminal window
1. Load your dev_tools mongo sandbox if you're using one (`dt-load $my_mongo_sandbox_name`) or make sure mongo is running.
1. Install the api sandbox with the command (only specify `-I` if you are *not* using a dev_tools mongo sandbox).
	```
	dt-new-sandbox -y -C -t cs_api -n $my_api_sandbox_name -D [-I]
	```
1. Optionally, create a playground file as **~/playgrounds/$my_api_playground_name**. Here's a template you might want to use. Make sure you replace the **$my_mongo_sandbox_name**
and **$my_api_sandbox_name** variables with their real vales
	```shell
	#desc# API server playground
	#sandboxes# $my_mongo_sandbox_name,$my_api_sandbox_name

	dt_load $my_mongo_sandbox_name --quiet
	dt_load $my_api_sandbox_name

	# uncomment these lines if you want to colorize your iTerm2 window
	#. $DT_TOP/lib/iterm2-utils.sh
	#it2_tab_rgb `basename ${BASH_SOURCE[0]}` 102 204 0

	cd $CS_API_TOP
	```
1. To load your playground, type the following ( (make sure you replace $my_api_playground_name with the real name).
	```
	dt-load-playground $my_api_playground_name
	```
1. If you were upgrading an existing sandbox and ran the command in the first step, finish up with these commands:
	```
	cd $CS_API_TOP
	/bin/rm -rf .git
	mv ~/sandboxes/$my_api_sandbox_name.ORIG/api_server/.git .
	/bin/rm -rf ~/sandboxes/$my_api_sandbox_name.ORIG
	```

1. If you'd like to run with a node watcher, run the following, replacing the `-e` argument with the file extensions you'd like to watch for changes:
	```
	nodemon -e js,hbs bin/api_server.js --one_worker
	```

1. If you'd like to run the api_server with a debugger, add an `--inspect` argument before the executable .js file as such:
	```
	node --inspect bin/api_server.js --one_worker
	```
	or

	```
	nodemon -e js,hbs --inspect bin/api_server.js --one_worker
	```

then, in VS Code, run the `Node: Debugger` task. You'll want to attach to the process running on port `9230` when prompted.