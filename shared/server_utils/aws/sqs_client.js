// This file provides a simple message queueing service using the Amazon SQS service
// The message queue service relies on the Amazon AWS SDK node client (http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html)
//
// SQS does not provide a callback mechanism when messages are received, instead we have to do a continuous loop of long-polling receipt
// requests, kind of sucks, but we encapsulate all that here so callers don't have to deal with it

'use strict';

const BoundAsync = require('../bound_async');

class SQSClient {

	constructor (options = {}) {
		Object.assign(this, options);
		this.sqs = this.aws.sqs;
		this.queues = {};
	}

	// create a queue given the name provided, messages will be returned in the handler callback provided
	createQueue (options) {
		if (!options.name) {
			throw 'must provide a queue name';
		}
		const params = {
			QueueName: options.name
		};
		return new Promise((resolve, reject) => {
			this.sqs.createQueue(params, (error, data) => {
				if (error) {
					return resolve();
					//return reject(`unable to create queue ${options.name}: ${error}`);
				}
				this.queues[options.name] = {
					name: options.name,
					options: options,
					url: data.QueueUrl
				};

				// we want a large visibility timeout to handle the long processing time
				// for weekly emails
				this.sqs.setQueueAttributes({
					QueueUrl: data.QueueUrl,
					Attributes: {
						VisibilityTimeout: '3600'
					}
				}, () => {});
				resolve();
			});
		});
	}

	// start listening to the specified queue
	listen (options) {
		const { name } = options;
		const queue = this.queues[name];
		if (!queue) {
			throw `cannot listen to queue ${options.name}, queue has not been created yet`;
		}
		queue.handler = options.handler;
		this._initiatePolling(name);
	}

	// stop listening on the given queue
	stopListening (queueName) {
		if (!this.queues[queueName]) {
			return;
		}
		this.queues[queueName].stopPolling = true;
	}

	// send a message to the given message queue
	sendMessage (queueName, data, options, callback) {
		options = options || {};
		if (typeof queueName !== 'string') {
			return callback('must provide a valid queue name');
		}
		const queue = this.queues[queueName];
		if (!queue) {
			return callback(`no queue found matching ${queueName}`);
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
		return new Promise((resolve, reject) => {
			this.sqs.sendMessage(params, error => {
				if (error) {
					return reject(`failed to send message to queue ${queueName}: ${error}`);
				}
				resolve();
			});
		});
	}

	// initiate a continuous polling for messages received in the given queue
	_initiatePolling (queueName) {
		const queue = this.queues[queueName];
		if (!queue) { return; }
		BoundAsync.whilst(
			this,
			() => {
				return !queue.stopPolling;
			},
			whilstCallback => {
				this._pollOnce(queueName, whilstCallback);
			}
		);
	}

	// long-poll a given message queue once for messages
	_pollOnce (queueName, callback) {
		const queue = this.queues[queueName];
		if (!queue) { return; }
		const params = {
			QueueUrl: queue.url,
			WaitTimeSeconds: 20 // maximum allowed
		};
		this.sqs.receiveMessage(params, (error, data) => {
			if (error) {
				this.logger.warn(`Error receiving message on queue ${queueName}: ${error}`);
				return callback();
			}
			if (!data || !(data.Messages instanceof Array)) {
				return callback();
			}
			return this._processMessages(queue, data.Messages, callback);
		});
	}

	// process messages received from the queue
	_processMessages (queue, messages, callback) {
		BoundAsync.forEachSeries(
			this,
			messages,
			(message, forEachCallback) => {
				this._processMessage(queue, message, forEachCallback);
			},
			callback
		);
	}

	// process data for a single message data from the given queue
	_processMessage (queue, message, callback) {
		this.log(`Received an SQS message on queue ${queue.name}: ${message.MessageId}:${message.ReceiptHandle}`);
		if (message.Body) {
			let data;
			try {
				data = JSON.parse(message.Body);
			}
			catch (error) {
				this.warn(`Unable to process message ${message.MessageId} on queue ${queue.name}: bad JSON data: ${error}`);
			}
			if (queue.handler) {
				queue.handler(data, message.MessageId, done => {
					if (done) {
						this._releaseMessage(queue, message, callback);
					}
				});
			}
			else {
				callback();
			}
		}
	}

	// release an already processed message from the queue
	_releaseMessage (queue, message, callback) {
		const params = {
			QueueUrl: queue.url,
			ReceiptHandle: message.ReceiptHandle
		};
		this.sqs.deleteMessage(params, error => {
			if (error) {
				this.warn(`Unable to delete message ${message.MessageId} from queue: ${error}`);
			}
			process.nextTick(callback);
		});
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
