// RabbitMQ (AMQP) configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let RabbitCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	RabbitCfg = CfgData.getSection('queuingEngine.rabbitmq');
}
else {
	RabbitCfg = {
		host: process.env.CS_API_RABBITMQ_HOST,
		port: process.env.CS_API_RABBITMQ_PORT,
		user: process.env.CS_API_RABBITMQ_USER,
		password: process.env.CS_API_RABBITMQ_PASSWORD
	};
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[rabbitmq]:', RabbitCfg);
module.exports = RabbitCfg;
