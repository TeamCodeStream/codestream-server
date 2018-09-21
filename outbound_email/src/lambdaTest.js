#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const LambdaLocal = require('lambda-local');
const AWSFactory = require('./server_utils/aws/aws');
const SQSClientFactory = require('./server_utils/aws/sqs_client');
const { callbackWrap } = require('./server_utils/await_utils');
const Config = require('./config');

(async function() {
	await OpenSQSClient();
})();

async function OpenSQSClient () {
	const aws = new AWSFactory(Config.aws);
	const sqsClient = new SQSClientFactory({ aws });
	console.log(`Listening to ${Config.outboundEmailQueueName}...`);
	await callbackWrap(
		sqsClient.createQueue.bind(sqsClient),
		{
			name: Config.outboundEmailQueueName,
			handler: HandleMessage
		}
	);
}

async function HandleMessage (message, releaseCallback) {
	releaseCallback(true); // this releases the message from the queue
	try {
		await LambdaLocal.execute({
			event: message,
			lambdaPath: './lambdaHandler',
			lambdaHandler: 'handler',
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

