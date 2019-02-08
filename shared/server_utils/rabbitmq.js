// This file provides a simple message queueing service using RabbitMQ (AMQP protocol)
//
// NOTE: requires the delayed message exchange plugin to be enabled in the rabbitmq server:
// https://github.com/rabbitmq/rabbitmq-delayed-message-exchange

'use strict';

const AMQP = require('amqplib');

class RabbitMQClient {

	constructor (options = {}) {
		Object.assign(this, options);
		this.queues = {};
	}

	// initialize 
	async init () {
		this.rabbitmq = await AMQP.connect(this.host);
	}

	// create a queue given the name provided, messages will be returned in the handler callback provided
	async createQueue (options) {
		if (!options.name) {
			throw 'must provide a queue name';
		}
		const channel = await this.rabbitmq.createChannel();
		channel.assertQueue(options.name);
		if (options.isPublisher) {
			await channel.deleteExchange(options.name);
			await channel.assertExchange(
				options.name,
				'x-delayed-message',
				{ 
					arguments: {
						'x-delayed-type': 'direct'
					}
				}
			);
		}
		if (options.handler) {
			await channel.consume(options.name, this._processMessage.bind(this));
		}
		this.queues[options.name] = {
			name: options.name,
			channel,
			handler: options.handler
		};
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
		const publishOptions = {};
		if (options.delay) {
			publishOptions.headers = {
				'x-delay': options.delay * 1000
			}
		};
		queue.channel.publish(
			queueName, 
			queueName, 
			Buffer.from(JSON.stringify(data)),
			publishOptions
		);
	}

	// process data for a single message data from the given queue
	_processMessage (message) {
		const { content, fields } = message;
		const queueName = fields.routingKey;	

		this.log(`Received a RabbitMQ message on queue ${queueName}`);
		const queue = this.queues[queueName];
		if (!queue) { return; }
		queue.channel.ack(message);
		if (!content || !queue.handler) { return; }

		let data;
		try {
			data = JSON.parse(content);
		}
		catch (error) {
			this.warn(`Unable to process message on queue ${queueName}: bad JSON data: ${error}`);
		}
		queue.handler(data);
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

module.exports = RabbitMQClient;
