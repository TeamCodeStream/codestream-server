// AWS configuration

'use strict';

let AwsCfg = {};
if (process.env.CS_API_CFG_FILE) {
	AwsCfg = require(process.env.CS_API_CFG_FILE).aws;
}
else {
	AwsCfg.region = process.env.CS_API_AWS_REGION || 'us-east-1';
	AwsCfg.sqs.outboundEmailQueueName = process.env.CS_API_OUTBOUND_EMAIL_SQS;
}

module.exports = AwsCfg;
