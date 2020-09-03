#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const LambdaLocal = require('lambda-local');
const OutboundEmailServerConfig = require('./config');
const OutboundEmailServer = require('./outboundEmailServer');

var OutboundEmailService;

(async function() {
	let Config = await OutboundEmailServerConfig.loadPreferredConfig();
	OutboundEmailService = new OutboundEmailServer({
		config: Config,
		messageHandler: HandleMessage
	});
	OutboundEmailService.start((error) => {
		if (error) {
			console.error('server failed to start: ' + error); // eslint-disable-line no-console
			process.exit();	
		}
	});
})();

async function HandleMessage (message, requestId, releaseCallback) {
	releaseCallback(true); // this releases the message from the queue
	try {
		await LambdaLocal.execute({
			event: message,
			lambdaFunc: OutboundEmailService,
			lambdaHandler: 'lambda',
			timeoutMs: 10000
		});
	}
	catch (error) {
		console.error('ERROR EXECUTING LAMBDA:', error);
	}
}
