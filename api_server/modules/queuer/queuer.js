// provides a message queue client to the API server, using AWS SQS as needed

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const RabbitMQClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/rabbitmq');
const TryIndefinitely = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/try_indefinitely');

class Queuer extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the desired AWS services
		return async () => {
			if (this.api.config.queuingEngine.selected !== 'rabbitmq') {
				return {};
			}
			this.api.log('Initiating RabbitMQ connection...');
			try {
				const { user, password, host, port } = this.api.config.queuingEngine.rabbitmq;
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
