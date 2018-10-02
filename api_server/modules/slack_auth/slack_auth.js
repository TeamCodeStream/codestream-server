// provide service to handle slack credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const ProviderInfoAuthorizer = require('./provider_info_authorizer');

class SlackAuth extends APIServerModule {

	services () {
		return async () => {
			return { slackAuth: this };
		};
	}

	async authorizeProviderInfo (providerInfo, options) {
		return await new ProviderInfoAuthorizer({ providerInfo, options }).exchangeAndAuthorize();
	}

	validateChannelName (name) {
		if (name.match(/[^a-z0-9-_[\]{}\\/]/)) {
			return 'illegal characters in channel name';
		}
		if (name.length > 21) {
			return 'name must be no longer than 21 characters';
		}
	}
}

module.exports = SlackAuth;
