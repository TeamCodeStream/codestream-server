// RabbitMQ (AMQP) configuration

'use strict';

let RabbitCfg = {};
if (process.env.CS_API_CFG_FILE) {
	RabbitCfg = require(process.env.CS_API_CFG_FILE).queuingEngine.rabbitmq;
}
else {
	RabbitCfg = {
		host: process.env.CS_API_RABBITMQ_HOST,
		port: process.env.CS_API_RABBITMQ_PORT,
		user: process.env.CS_API_RABBITMQ_USER,
		password: process.env.CS_API_RABBITMQ_PASSWORD
	};
}

module.exports = RabbitCfg;
