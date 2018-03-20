// AWS configuration

'use strict';

module.exports = {
	region: 'us-east-1',
	sqs: {
		outboundEmailQueueName: process.env.CS_API_OUTBOUND_EMAIL_SQS
	}
};
