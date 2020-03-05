// AWS configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');

let AwsCfg = {
	region: null,
	sqs: {
		outboundEmailQueueName: null
	}
};

if (Object.keys(CfgData.getSection('queuingEngine.awsSQS')).length > 0) {
	AwsCfg.region = CfgData.getProperty('queuingEngine.awsSQS.region');
	AwsCfg.sqs.outboundEmailQueueName = CfgData.getProperty('queuingEngine.awsSQS.outboundEmailQueueName');
}
else {
	// api configured to use rabbit but it looks for the queue name in the aws config
	// FIXME
	AwsCfg.region = 'us-east-1';  // we shouldn't need to set this!
	AwsCfg.sqs.outboundEmailQueueName = CfgData.getProperty('queuingEngine.rabbitmq.outboundEmailQueueName');
}


if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[aws]:', JSON.stringify(AwsCfg, undefined, 10));
module.exports = AwsCfg;
