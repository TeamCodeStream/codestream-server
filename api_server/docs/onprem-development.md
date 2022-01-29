# On-Prem Development Configuration

If you [followed the directions](README.md) in the main API README, you already
have an On-Prem Development configuration file in your ~/.codestream/config/
directory.

1. Make sure you have the **onprem-development** codestream configuration file.
   If this command doesn't indicate any files, try running `dt-dev-update-secrets`.
	```
	$ ls ~/.codestream/config/onprem-development_local_*_.json
	```

1. _Complete this step only if you want to customize your configuration._ If you
   want to edit the configuration, you need to choose a name and copy the most
   recent onprem-development config to a file with the same format. For example,
   `onprem-custom-config_local_N_.json`. Then edit that file to taste. You'll
   also want to add the file to the update hook so it gets maintained
   automatically as new config file versions are downloaded.
   ```
   $ echo onprem-development:onprem-custom-config >> ~/.codestream/config/codestream-cfg-update-hook
   ```

1. Select this configuration as the default for local development (if you made a
   custom config file, use its name in lieu of **onprem-development**).
	```
	$ echo onprem-development > ~/.codestream/config/codestream-cfg-default.local
	```

1. The broadcaster service replaces PubNub. [Install a broadcaster
   sandbox](https://github.com/teamcodestream/broadcaster).

1. Load all of your sandboxes into the same shell and create an on-prem
   playground file for yourself.
	```
	$ dt-load mongo
	$ dt-load api
	$ dt-load mailin
	$ dt-load mailout
	$ dt-load bc
	$ dt-sb-create-playground -t $CS_API_TOP/sandbox/playgrounds/onprem.template
	```
	From now on, simply load the onprem playground with `dt-load-playground onprem`

1. RabbitMQ replaces AWS SQS. You can install RabbitMQ natively on your system
   ([notes here](README.rabbitmq)) or you can use our pre-configured docker
   image.

   With Docker installed and running on your development host:
	```
	$ docker run -d -p 5672:5672 -p 15672:15672 --name csrabbitmq teamcodestream/rabbitmq-onprem:0.0.0
	```
