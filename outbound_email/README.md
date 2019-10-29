
# Outbound Email Service

The outbound email service de-queues requests made by the API and sends email
notifications.

* It can be installed as either a lambda function or sandbox
* It can send email using the [sendgrid](https://sendgrid.com) service or the
  [NodeMailer](https://www.npmjs.com/package/nodemailer) npm module.
* It supports [AWS SQS](https://aws.amazon.com/sqs/) and
  [RabbitMQ](https://www.rabbitmq.com).


## Prerequisites
1. Install the dev_tools tookkit
   [here](https://github.com/teamcodestream/dev_tools).
1. Make sure you can access the CodeStream network via the VPN.
1. Review how we manage our [server
   configurations](https://github.com/TeamCodeStream/api_server/blob/develop/README.unified-cfg-file.md).
1. Make sure your API and mongo sandboxes are running on their default
   development ports.

## Quick Start
1. The default configuration will use AWS SQS, sendgrid and run as as node
   sandbox.
1. Choose a _sandbox name_ (for exmaple, **mailout**) and install the sandbox:
    ```
    $ dt-new-sandbox -yCD -t cs_mailout -n mailout
    ```
1. Load your sandbox
    ```
    $ dt-load mailout
    ```
1. Create a playground named **mailout** (different than the sandbox):
    ```
    $ dt-sb-create-playground -t $CS_OUTBOUND_EMAIL_TOP/sandbox/playgrounds/default.template
    ```
1. Kill your shell and start a new one. Load your playground and start up your service
    ```
    $ dt-load-playground mailout
    $ cs_outbound_email-service start
    ```
1. To start in the foreground without clustering:
    ```
    $ $CS_OUTBOUND_EMAIL_TOP/bin/outbound_email_server.js --one_worker
    ```

## Running as a lambda function

If you run the service as a lambda function, _**make sure your VPN is up**_.
The lambda function needs to connect to your mongo db.

Execute these commands in your sandbox to install a lambda function
called **local_{DT_USER}_outboundEmail**.
```
$ . sandbox/lambda-configs/lambda-defaults.sh   # prepare sandbox for lambda deployment
$ npm run pack                # zip the sandbox & config to out/outbound-email.zip
$ npm run lambda:config       # create the lambda function config file in out/outbound-email.lambda.json
$ npm run lambda:install      # create the lambda function and sqs trigger
```

### Development Lifecycle with Lambda

As the outbound_email sandbox will change over time, as may your VPN connection, it is not
wise to keep your lambda development function up and running indefinitely. It will eventually
stop working properly and costs money. So when you're done doing your scope of work,
uninstall your lambda function.  

You can see the lambda functions with:
```
$ dt-aws-lamnda -a list-funcs
```
In a nutshell, the development lifecycle looks like this:
1. Modify your API server so it queues outbound email events
1. Update your outbound_email sandbox and install your lambda function
1. During development, update your function's code or environment
variables as often as is needed.
1. Push your changes. TeamCity will handle publishing them across the various environments.
1. When you're done, modifued your API server so it no longer puts outbound
email events on the queue.
1. Uninstall your lambda function.

Use the npm scripts below to do the work of installing, uninstalling, updating, etc..  


## NPM scripts
Build / Create asset (out/outbound-email.zip)
```
$ npm run pack
```

Update the Lambda function in AWS with the latest build
```
$ npm run lambda:update
```

Perform both abovemented tasks at once
```
$ npm run reupdate
```

Create the Lamda function definition (../out/outbound-email.lambda.json)
```
$ npm run lambda:config
```

Install the lambda function and a trigger on the SQS queue
```
$ npm run lambda:install
```

Uninstall the lambda function and trigger (do this when you're done developing). Note
that uninstalling a lambda function and its triggers takes time to completely flush
in AWS so you should wait a little bit before you re-install it.
```
$ npm run lambda:uninstall
```

Update the Lambda function environment variables (prerequisite - lamda:config)
```
$ npm run lambda:update_env
```

Clean the repo
```
$ npm run clean
```

## Testing
Note that the default behavior for your api server is to disable
adding email events to the SQS queue so you need to enable that. In your api
sandbox run `unset CS_API_SUPPRESS_EMAIL` and restart the service.  

### Have the api service add an outbound email event to the SQS queue
This command will drop a registration email event in the SQS queue for your
outbound email service to process (the email address must be unique each time
your run it).
```
cs_outbound_email-ping jj+lambda2@codestream.com
```

### Process the event directly in your sandbox
This client app will poll your SQS queue and process the event (no lambda
function used)
```
cd src && ./LambdaTest.js
```

### Test your Lambda Function
Once your lambda function and trigger are installed, they will process the 
registration email event your api service queued above from the ping.

