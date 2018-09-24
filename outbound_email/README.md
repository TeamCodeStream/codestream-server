
# Outbound Email Service

This service generation and sending of outbound emails. It is meant to be run using
the AWS Lambda service. This service is triggered by SQS events.

## Installation
### With dev_tools
If you are using the dev_tools toolkit, install the sandbox with this command. Once
you do, it's recommended that you copy the playground template file to your **$DT_PLAYGROUNDS**
directory and edit it accordingly.
```
dt-new-sandbox -yCD -t cs_mailout -n $sandbox_name
dt-load $sandbox_name
cp $CS_OUTBOUND_EMAIL_TOP/sandbox/playground.template $DT_PLAYGROUNDS/$playground_name
```
### Without dev_tools
You're on your own to supply node & npm. Recommended versions are node 8.11.3 and npm 6.2.0.
You're also on your own to setup your shell's environment.  Default environment variable
definitions can be found in **sandbox/defaults.sh**.
1. Clone the project
1. `(cd src && npm install --no-save)`

## Test
The execution of the lambda function can be tested locally, using a node module called
lambda-local to simulate the lambda execution environment. To test locally, you must
have the correct environment variables defined for your local environment, then run:
```
src/lambdaTest.js
```

## NPM scripts
### Clean the repo
```
cd src && npm run clean
```

### Build / Create asset (zip file)
This will create out/outbound-email.zip.
```
cd src && npm run zip
```

### Update the Lambda function in AWS with the latest build
```
cd src && npm run update
```

### Perform both abovemented tasks at once
```
cd src && npm run reupdate
```

