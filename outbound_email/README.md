
# Outbound Email Service

This service generation and sending of outbound emails. It is meant to be run using
the AWS Lambda service. This service is triggered by SQS events.

## Installation
### With dev_tools
If you are using the dev_tools toolkit, install the sandbox with this command. Once
you do, it's recommended that you copy the playground template file to your **$DT_PLAYGROUNDS**
directory (and edit it accordingly).
```
dt-new-sandbox -yCD -t cs_mailout -n $sandbox_name
```
### Without dev_tools
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
Build the package into the out directory with `(cd src && npm run zip)`  

Upload the package to the AWS Lambda service (assuming outboundEmail function name) with:
`(cd src && npm run update)`

To perform both abovementioned tasks at once: `(cd src && npm run reupdate)`
