# This project builds the AWS lambda package used to send outbound emails, along with the 
# associated processing logic

# To build the package (into the out directory of this project):
cd src
npm run zip

# To upload the package to the AWS function (assuming outboundEmail function name)
cd src
npm run update

# To do both
cd src
npm run reupdate

# The above steps assume node modules have already been installed, like:
cd src
npm install --no-save

# The execution of the lambda function can be tested locally, using a node module called
# lambda-local to simulate the lambda execution environment. To test locally, you must
# have the correct environment variables defined for your local environment, then run...
src/lambdaTest.js



