// RabbitMQ (AMQP) configuration

'use strict';

module.exports = {
	host: process.env.CS_API_RABBITMQ_HOST,
	port: process.env.CS_API_RABBITMQ_PORT,
	user: process.env.CS_API_RABBITMQ_USER,
	password: process.env.CS_API_RABBITMQ_PASSWORD
};
