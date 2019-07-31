// RabbitMQ (AMQP) configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let RabbitCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
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

if (ShowCfg) console.log('Config[rabbitmq]:', JSON.stringify(RabbitCfg, undefined, 10));
module.exports = RabbitCfg;
