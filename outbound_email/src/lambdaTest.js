#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const LambdaLocal = require('lambda-local');
const OutboundEmailServerConfig = require('./config');
const OutboundEmailServer = require('./outboundEmailServer');

var OutboundEmailService;
var Config;

(async function() {
	let Config = await OutboundEmailServerConfig.loadPreferredConfig();
	Config.messageHandler = HandleMessage;
	OutboundEmailService = new OutboundEmailServer(Config);
	OutboundEmailService.start((error) => {
		if (error) {
			console.error('server failed to start: ' + error); // eslint-disable-line no-console
			process.exit();	
		}
	});
})();

async function HandleMessage (message, releaseCallback) {
	releaseCallback(true); // this releases the message from the queue
	// NOTE: This is the only place we expect the config data to be available
	//       from a global source
	Config = await OutboundEmailServerConfig.loadPreferredConfig();
	try {
		await LambdaLocal.execute({
			event: message,
			lambdaFunc: OutboundEmailService,
			lambdaHandler: 'lambda',
			profilePath: '~/.aws/credentials',
			timeoutMs: 10000,
			environment: {
				CS_OUTBOUND_EMAIL_MONGO_PORT: Config.mongo.port,
				CS_OUTBOUND_EMAIL_MONGO_HOST: Config.mongo.host,
				CS_OUTBOUND_EMAIL_MONGO_DATABASE: Config.mongo.database,
				CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT: Config.awayTimeout,
				CS_OUTBOUND_EMAIL_PUBNUB_SUBSCRIBE_KEY: Config.pubnub.subscribeKey,
				CS_OUTBOUND_EMAIL_PUBNUB_PUBLISH_KEY: Config.pubnub.publishKey,
				CS_OUTBOUND_EMAIL_PUBNUB_SECRET: Config.pubnub.secretKey,
				CS_OUTBOUND_EMAIL_SENDGRID_SECRET: Config.sendgrid.apiKey,
				CS_OUTBOUND_EMAIL_TO: Config.sendgrid.emailTo,
				CS_OUTBOUND_EMAIL_SQS: Config.outboundEmailQueueName
			}
		});
	}
	catch (error) {
		console.error('ERROR EXECUTING LAMBDA:', error);
	}
}

