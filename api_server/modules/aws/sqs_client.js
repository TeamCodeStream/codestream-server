// This file provides a simple message queueing service using the Amazon SQS service
// The message queue service relies on the Amazon AWS SDK node client (http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html)
//
// SQS does not provide a callback mechanism when messages are received, instead we have to do a continuous loop of long-polling receipt
// requests, kind of sucks, but we encapsulate all that here so callers don't have to deal with it

'use strict';

class SQSClient {

	constructor (options = {}) {
		Object.assign(this, options);
		this.sqs = this.aws.sqs;
		this.queues = {};
	}

	// create a queue given the name provided, messages will be returned in the handler callback provided
	async createQueue (options) {
		if (!options.name) {
			throw 'must provide a queue name';
		}
		let data;
		try {
			data = await this.sqs.createQueue({ QueueName: options.name });
		}
		catch (error) {
			throw `unable to create queue ${options.name}: ${error}`;
		}
		this.queues[options.name] = {
			name: options.name,
			options: options,
			url: data.QueueUrl,
			handler: options.handler
		};
		if (!options.dontListen) {
			this._initiatePolling(options.name);
		}
	}

	// send a message to the given message queue
	async sendMessage (queueName, data, options) {
		options = options || {};
		if (typeof queueName !== 'string') {
			throw 'must provide a valid queue name';
		}
		const queue = this.queues[queueName];
		if (!queue) {
			throw `no queue found matching ${queueName}`;
		}
		const params = {
			MessageBody: JSON.stringify(data),
			QueueUrl: queue.url
		};
		if (typeof options.delay === 'number') {
			params.DelaySeconds = options.delay;
		}
		if (typeof options.attributes === 'object') {
			params.MessageAttributes = options.attributes;
		}
		try {
			await this.sqs.sendMessage(params);
		}
		catch (error) {
			throw `failed to send message to queue ${queueName}: ${error}`;
		}
	}

	// initiate a continuous polling for messages received in the given queue
	async _initiatePolling (queueName) {
		const queue = this.queues[queueName];
		if (!queue) { return; }
		while (!queue.stopPolling) {
			await this._pollOnce(queueName);
		}
	}

	// long-poll a given message queue once for messages
	async _pollOnce (queueName) {
		const queue = this.queues[queueName];
		if (!queue) { return; }
		const params = {
			QueueUrl: queue.url,
			WaitTimeSeconds: 20 // maximum allowed
		};
		let data;
		try {
			data = await this.sqs.receiveMessage(params);
		}
		catch (error) {
			return this.warn(`Error receiving message on queue ${queueName}: ${error}`);
		}
		if (data && (data.Messages instanceof Array)) {
			await this._processMessages(queue, data.Messages);
		}
	}

	// process messages received from the queue
	async _processMessages (queue, messages) {
		for (let message of messages) {
			await this._processMessage(queue, message);
		}
	}

	// process data for a single message data from the given queue
	async _processMessage (queue, message) {
		this.log(`Received an SQS message on queue ${queue.name}: ${message.MessageId}:${message.ReceiptHandle}`);
		if (!message.Body) { return; }
		let data;
		try {
			data = JSON.parse(message.Body);
		}
		catch (error) {
			this.warn(`Unable to process message ${message.MessageId} on queue ${queue.name}: bad JSON data: ${error}`);
		}
		if (queue.handler) {
			await queue.handler(data, async () => {
				await this._releaseMessage(queue, message);
			});
		}
	}

	// release an already processed message from the queue
	async _releaseMessage (queue, message) {
		const params = {
			QueueUrl: queue.url,
			ReceiptHandle: message.ReceiptHandle
		};
		try {
			await this.sqs.deleteMessage(params);
		}
		catch (error) {
			this.warn(`Unable to delete message ${message.MessageId} from queue: ${error}`);
		}
	}

	log (message) {
		if (this.logger) {
			this.logger.log(message);
		}
	}

	warn (message) {
		if (this.logger) {
			this.logger.warn(message);
		}
	}
}

module.exports = SQSClient;
