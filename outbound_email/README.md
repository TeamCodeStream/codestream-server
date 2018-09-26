
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
dt-new-sandbox -yCD -t cs_mailout -n $sandbox_name -b develop
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
cd src && npm run build && npm run lambda:install
```

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

Create the Lamda function definition (../out/lambda.json)
```
cd src && npm run lambda:config
```

Install the lambda function and a trigger on the SQS queue
```
cd src && npm run lambda:install
```

Uninstall the lambda function and trigger (do this when you're done developing)
```
cd src && npm run lambda:uninstall
```

Clean the repo
```
cd src && npm run clean
```


## Test
### Direct from SQS queue
This client app will read the queue directly and process the message.
```
src/LambdaTest.js
```

### Lambda Function
From inside your sandbox do a ping test. This script will register a new email
with your API server (so it must be a unique address each time you run it). If
the lambda function works, you should get an email to your codestream gmail
account ($CS_OUTBOUND_EMAIL_TO).
```
cs_outbound_email-ping jj+lambda2@codestream.com
```
