// provides AWS-related services to the API server,
// the various services are all collected under one roof here

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const AWS = require(process.env.CS_API_TOP + '/server_utils/aws/aws');
const SQSClient = require(process.env.CS_API_TOP +'/server_utils/aws/sqs_client');

class AWSModule extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the desired AWS services
		if (this.api.config.api.dontWantAWS) {
			this.api.log('Not configured to use AWS services');
			return null;
		}
		return async () => {
			this.api.log('Initiating AWS services...');
			this.aws = new AWS(this.api.config.aws);
			this.awsServices = {};
			this.initializeSQS();
			return this.awsServices;
		};
	}

	initializeSQS () {
		this.awsServices.queueService = new SQSClient({ aws: this.aws, logger: this.api });
	}
}

module.exports = AWSModule;
