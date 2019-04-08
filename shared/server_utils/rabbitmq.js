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
		const { name } = options;
		if (!name) {
			throw 'must provide a queue name';
		}
		const channel = await this.rabbitmq.createChannel();
		await channel.assertExchange(
			name,
			'x-delayed-message',
			{ 
				durable: true,
				arguments: {
					'x-delayed-type': 'fanout'
				}
			}
		);
		await channel.assertQueue(name, { durable: true });
		await channel.bindQueue(name, name, '');
		channel.on('error', error => {
			this.warn(`RabbitMQ handler error: ${error.message}`);
		});
		this.queues[options.name] = {
			name: options.name,
			channel
		};
	}

	// start listening to the specified queue
	async listen (options) {
		const { name } = options;
		const queue = this.queues[name];
		if (!queue) {
			throw `cannot listen to queue ${options.name}, queue has not been created yet`;
		}
		queue.handler = options.handler;
		const result = await queue.channel.consume(name, this._processMessage.bind(this));
		queue.tag = result.consumerTag;
	}
	
	// stop listening on the given queue
	stopListening (queueName) {
		const queue = this.queues[queueName];
		if (!queue || !queue.channel || !queue.tag) {
			return;
		}
		queue.channel.cancel(queue.tag);
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
		const publishOptions = {
			persistent: true
		};
		if (options.delay) {
			publishOptions.headers = {
				'x-delay': options.delay * 1000
			};
		}
		queue.channel.publish(
			queueName, 
			'', 
			Buffer.from(JSON.stringify(data)),
			publishOptions
		);
	}

	// process data for a single message data from the given queue
	_processMessage (message) {
		const { content, fields } = message;
		const name = fields.exchange;	

		this.log(`Received a RabbitMQ message on queue ${name}`);
		const queue = this.queues[name];
		if (!queue) { return; }
		queue.channel.ack(message);
		if (!content || !queue.handler) { return; }

		let data;
		try {
			data = JSON.parse(content);
		}
		catch (error) {
			this.warn(`Unable to process message on queue ${name}: bad JSON data: ${error}`);
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
