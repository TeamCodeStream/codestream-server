// provides a message queue client to the API server, using AWS SQS as needed

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const RabbitMQClient = require(process.env.CS_API_TOP +'/server_utils/rabbitmq');
const TryIndefinitely = require(process.env.CS_API_TOP + '/server_utils/try_indefinitely');

class Queuer extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the desired AWS services
		return async () => {
			if (!this.api.config.api.dontWantAWS) {
				return {};
			}
			this.api.log('Initiating RabbitMQ connection...');
			try {
				const { user, password, host, port } = this.api.config.rabbitmq;
				const config = {
					host: `amqp://${user}:${password}@${host}:${port}`,
					logger: this.api,
					isPublisher: true
				};
				await TryIndefinitely(async () => {
					this.rabbitmq = new RabbitMQClient(config);
					await this.rabbitmq.init();
				}, 5000, this.api, 'Unable to connect to RabbitMQ, retrying...');
			}
			catch (error) {
				this.api.error('Unable to initiate RabbitMQ connection: ' + error.message);
				return;
			}
			return { queueService: this.rabbitmq };
		};
	}
}

module.exports = Queuer;
