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
	// FIXME: we're adding a property to the config (message handler). Booo.
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
	// NOTE: This is the only place we expect the config data to be available from a global source
	Config = await OutboundEmailServerConfig.loadPreferredConfig();
	try {
		await LambdaLocal.execute({
			event: message,
			lambdaFunc: OutboundEmailService,
			lambdaHandler: 'lambda',
			profilePath: '~/.aws/credentials', // TODO: this isn't good; the AWS SDK should handle this, not us
			timeoutMs: 10000,
			environment: {
				CS_OUTBOUND_EMAIL_MONGO_PORT: Config.mongo.port,	// FIXME: this was never defined in the config & shouldn't be used
				CS_OUTBOUND_EMAIL_MONGO_HOST: Config.mongo.host,	// FIXME: this was never defined in the config & shouldn't be used
				// CS_OUTBOUND_EMAIL_MONGO_URL: Config.outboundEmailServer.storage.mongo.url, // FIXME: this would be correct - not sure of the env var
				CS_OUTBOUND_EMAIL_MONGO_DATABASE: Config.outboundEmailServer.storage.mongo.database,  // mongo values are overriden for outbound email
				CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT: Config.awayTimeout, // FIXME: this was never defined in the config
				CS_OUTBOUND_EMAIL_PUBNUB_SUBSCRIBE_KEY: Config.outboundEmailServer.pubnub.subscribeKey,
				CS_OUTBOUND_EMAIL_PUBNUB_PUBLISH_KEY: Config.outboundEmailServer.pubnub.publishKey,
				CS_OUTBOUND_EMAIL_PUBNUB_SECRET: Config.outboundEmailServer.pubnub.secretKey,
				CS_OUTBOUND_EMAIL_SENDGRID_SECRET: Config.emailDeliveryService.sendgrid.apiKey, // FIXME: The sendgrid prop may not be defined
				CS_OUTBOUND_EMAIL_TO: Config.email.emailTo,
				CS_OUTBOUND_EMAIL_SQS: Config.queuingEngine[Config.queuingEngine.selected].outboundEmailQueueName
			}
		});
	}
	catch (error) {
		console.error('ERROR EXECUTING LAMBDA:', error);
	}
}

