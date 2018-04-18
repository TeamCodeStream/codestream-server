// provides an integration service to the API server, this allows posts to be
// sent to and received from our integration bot

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const IntegrationBotClient = require('./integration_bot_client');

class IntegrationModule extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the integration client as
		// the messager service
		return async () => {
			if (!this.api.config[this.integrationName] || !this.api.config[this.integrationName].botOrigin) {
				return this.api.warn(`Will not connect to ${this.integrationName} bot, no configuration or origin supplied`);
			}

			this.api.log(`Connecting to ${this.integrationName} bot...`);
			this.integrationConfig = Object.assign({}, this.api.config[this.integrationName]);
			this.integrationConfig.integrationName = this.integrationName;
			this.botClient = new IntegrationBotClient(this.integrationConfig);
			return { [this.integrationName]: this.botClient };
		};
	}

	getRoutes () {
		// provide a route for incoming posts from the integration bot
		return [
			{
				method: 'put',
				path: `no-auth/${this.integrationName}-enable`,
				requestClass: require('./integration_enable_request')
			},
			{
				method: 'post',
				path: `no-auth/${this.integrationName}-post`,
				requestClass: require('./integration_post_request')
			}
		];
	}

}

module.exports = IntegrationModule;
