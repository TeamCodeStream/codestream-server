# OnPrem Development Configuration

## Create (and maintain) your config file
A config file template,
**~/.codestream/config/local-onprem-development.json.template**, is deployed via
the `dt-update-secrets` command. You should copy it to
**local-onprem-development.json** in the same directory and edit it by filling
all the template variables (search of '{{' inside the file).

You should also review it and make any other changes you require.

As new templates are deployed over time you will need a reliable, repeatable way
to merge the new template version with your manually created config file. For
now, you're on your own. Keep your json files sorted and use diff.
```
$ codestream-configs/bin/process-profile --sort-json <json-file>
```

## Install the sandboxes
1. [mongo](https://github.com/teamcodestream/mongodb_tools) or provide your own.
1. [api](README.md)
1. [broadcaster](https://github.com/teamcodestream/broadcaster)
1. [outbound-email](https://github.com/teamcodestream/outbound_email)

## Create a consolidated playground file for OnPrem development

_NOTE:_ Consolidating multiple node-based sandboxes into one playground may
cause issues since all services will find **node, npm, globally installed npm
modules** and **node_modules/.bin/** from whichever node-based sandbox was loaded
last.

1. Start with a new terminal and load all the sandboxes
	```
	$ dt-load <mongo-sandbox-name>
	$ dt-load <api-sandbox-name>
	$ dt-load <broadcaster-sandbox-name>
	$ dt-load <outbound-email-sandbox-name>
	```

1. Create your playground file (**$DT_PLAYGROUNDS/\<onprem-playground-filename\>**) from this template.
	```
	$ dt-sb-create-playground -n <onprem-playground-filename> -t $CS_API_TOP/sandbox/playgrounds/consolidated-onprem.template
	```

1. When loading your playground in future shells, you can use the optional
   **--start** and **--stop** parameters. The default start/stop behavior
   includes controlling the rabbitmq docker service (see below for more info).
	```
	$ dt-load-playground <onprem-playground-file-name> [--start | --stop]
	```

## Install RabbitMQ

The onprem configuration requires RabbitMQ for message queuing so you need to
provide that. You can either install and configure it on your own ([there are
some notes here](README.rabbitmq)) or you can run a preconfigured docker
container.

On a mac (with docker installed):
```
$ docker run -d -p 5672:5672 --name csrabbitmq teamcodestream/rabbitmq-onprem:0.0.0
```

