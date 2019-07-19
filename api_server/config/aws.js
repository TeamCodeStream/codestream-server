// AWS configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let AwsCfg = {
	region: null,
	sqs: {
		outboundEmailQueueName: null
	}
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	AwsCfg.region = CfgData.getProperty('queuingEngine.awsSQS.region');
	AwsCfg.sqs.outboundEmailQueueName = CfgData.getProperty('queuingEngine.awsSQS.outboundEmailQueueName');
}
else {
	AwsCfg.region = process.env.CS_API_AWS_REGION || 'us-east-1';
	AwsCfg.sqs.outboundEmailQueueName = process.env.CS_API_OUTBOUND_EMAIL_SQS;
}

module.exports = AwsCfg;
