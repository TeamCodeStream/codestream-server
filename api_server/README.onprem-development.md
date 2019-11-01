# On-Prem Development Configuration

If you [followed the directions](README.md) in the main API README, you already
have an On-Prem Development configuration template in your ~/.codestream/config/
directory.

1. Copy the latest config template to `onprem-development_local_*.json.template`
   so you can edit it.
	```
	$ cd ~/.codestream/config
	$ latestTemplate=`ls onprem-development_local_*.json.template|tail -1`
	$ latestBase=`echo $latestTemplate | sed -e 's/\.template$//'`
	$ cp $latestTemplate $latestBase
	```

1. Edit `$latestBase` and fill in any required template fields (search for `{{`
   in the file).  While this is technically optional, our on-prem deployment
   uses NodeMailer in lieu of SendGrid. Update your config file accordingly.

1. Select this configuration as the default for local development.
	```
	$ echo onprem-development > ~/.codestream/config/codestream-cfg-default.local
	```

1. Add this config to the _dt-update-secrets hooks file_ if it isn't already in
   there; check first, you don't want it in there twice.
	```
	$ echo onprem-development > ~/.codestream/config/codestream-cfg-update-hook
	```

1. The broadcaster service replaces PubNub. [Install a broadcaster
   sandbox](https://github.com/teamcodestream/broadcaster).

1. Load all of your sandboxes and create an on-prem playground file for
   yourself.
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
	$ docker run -d -p 5672:5672 --name csrabbitmq teamcodestream/rabbitmq-onprem:0.0.0
	```
