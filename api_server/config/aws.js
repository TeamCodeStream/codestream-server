// AWS configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let AwsCfg = {
	region: null,
	sqs: {
		outboundEmailQueueName: null
	}
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
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
}
else {
	AwsCfg.region = process.env.CS_API_AWS_REGION || 'us-east-1';
	AwsCfg.sqs.outboundEmailQueueName = process.env.CS_API_OUTBOUND_EMAIL_SQS;
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[aws]:', AwsCfg);
module.exports = AwsCfg;
