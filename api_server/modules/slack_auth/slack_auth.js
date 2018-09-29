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
		return await new ProviderInfoAuthorizer({ providerInfo, options }).authorize();
	}
}

module.exports = SlackAuth;
