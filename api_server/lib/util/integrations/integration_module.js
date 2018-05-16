// provides an integration service to the API server, this allows posts to be
// sent to and received from our integration bot

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const IntegrationBotClient = require('./integration_bot_client');
const HttpProxy = require('express-http-proxy');

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

	// provide middleware to accept application/x-www-form-urlencoded content-type,
	// and pass it through proxy to the integration bot
	formEncodingToRaw (request, response, next) {
		if (!request.headers.hasOwnProperty('content-type')) {
			return next();
		}
		if (!request.headers['content-type'].match(/application\/x-www-form-urlencoded/)) {
			return next();
		}
		let data = '';
		request.setEncoding('utf8');
		request.on('data', chunk => {
			data += chunk;
		});
		request.on('end', () => {
			request.rawBody = data;
			next();
		});
		request.on('error', error => {
			this.api.warn('Error processing integration data: ' + JSON.stringify(error));
			next();
		});
	}

	// yeah, B.S. ... the npm proxy module doesn't pass through ordinary query parameters
	reconstructQuery (request) {
		return Object.keys(request.query).map(param => `${param}=${request.query[param]}`).join('&');
	}

	// provide a proxying function to handle proxying outside requests that are bound for
	// the integration bot
	integrationProxy (originUrl, path) {
		return HttpProxy(
			originUrl,
			{
				proxyReqPathResolver: (request) => {
					const query = this.reconstructQuery(request);
					return `${path}?${query}`;
				},
				proxyReqBodyDecorator: (bodyContent, request) => {
					if (
						request.headers.hasOwnProperty('content-type') &&
						request.headers['content-type'].match(/application\/x-www-form-urlencoded/)
					) {
						// for form encoded data, pass the raw data we captured earlier
						return request.rawBody;
					}
					else {
						// otherwise, normal json...
						return bodyContent;
					}
				}
			}
		);
	}
}

module.exports = IntegrationModule;
