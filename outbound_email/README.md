
# Outbound Email Service

This service generation and sending of outbound emails. It is meant to be run using
the AWS Lambda service. This service is triggered by SQS events.

## Installation
Many of the build, setup and tear down functions depend on the
[dev_tools](https://github.com/teamcodestream/dev_tools) toolkit
so it's strongly advised you install it as a prerequisite. In local development, the
lambda function needs to access your mongodb server so your VPN connection must
be up.

### Local Sandbox
#### With dev_tools
If you are using the dev_tools toolkit, install the sandbox with this command. Once
you do, it's recommended that you copy the playground template file to your **$DT_PLAYGROUNDS**
directory and edit it accordingly.
```
dt-new-sandbox -yCD -t cs_mailout -n $sandbox_name
dt-load $sandbox_name
cp $CS_OUTBOUND_EMAIL_TOP/sandbox/playground.template $DT_PLAYGROUNDS/$playground_name
```
#### Without dev_tools
You're on your own to supply node & npm. Recommended versions are node 8.11.3 and npm 6.2.0.
You're also on your own to setup your shell's environment.  Default environment variable
definitions can be found in **sandbox/defaults.sh**.
1. Clone the project
1. `(cd src && npm install --no-save)`


## Quick Start
1. Make sure your API sandbox running on the default port (that includes mongo). The
API service will create the outbound SQS mail queue so you must run it before you
install the lambda function and trigger.
1. Build and bundle the outgoing mail service and install the lambda function and trigger.
```
cd src && npm run build && npm run lambda:config && npm run lambda:install
```

## Development Lifecycle
As the outbound_email sandbox will change over time, as may your VPN connection, it is not
wise to keep your lambda development function up and running indefinitely. It will eventually
stop working properly and costs money. So when you're done doing your scope of work,
uninstall your lambda function.  

You can see the lambda functions with:
```
dt-aws-lamnda -a list-funcs
```
In a nutshell, the development lifecycle looks like this:
1. Modify your API server so it queues outbound email events
1. update your outbound_email sandbox and install your lambda function
1. during development, update your function's code or environment
variable as often as is needed.
1. Push your changes. TeamCity will handle publishing them across the various environments.
1. When you're done, modifued your API server so it no longer puts outbound
email events on the queue.
1. Uninstall your lambda function.

Use the npm scripts below to do the work of installing, uninstalling, updating, etc..  


## NPM scripts
Build / Create asset (../out/outbound-email.zip)
```
cd src && npm run build
```

Update the Lambda function in AWS with the latest build
```
cd src && npm run lambda:update
```

Perform both abovemented tasks at once
```
cd src && npm run reupdate
```

Create the Lamda function definition (../out/outbound-email.lambda.json)
```
cd src && npm run lambda:config
```

Install the lambda function and a trigger on the SQS queue
```
cd src && npm run lambda:install
```

Uninstall the lambda function and trigger (do this when you're done developing). Note
that uninstalling a lambda function and its triggers takes time to completely flush
in AWS so you should wait a little bit before you re-install it.
```
cd src && npm run lambda:uninstall
```

Update the Lambda function environment variables (prerequisite - lamda:config)
```
cd src && npm run lambda:update_env
```

Clean the repo
```
cd src && npm run clean
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
