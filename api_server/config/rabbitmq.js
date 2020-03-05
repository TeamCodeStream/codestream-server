// RabbitMQ (AMQP) configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const RabbitCfg = CfgData.getSection('queuingEngine.rabbitmq');

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[rabbitmq]:', JSON.stringify(RabbitCfg, undefined, 10));
module.exports = RabbitCfg;
