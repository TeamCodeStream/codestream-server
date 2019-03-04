// provide service to handle slack credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');
const ProviderInfoAuthorizer = require('./provider_info_authorizer');

const OAUTH_CONFIG = {
	provider: 'slack',
	host: 'slack.com',
	authPath: 'oauth/authorize',
	tokenPath: 'api/oauth.access',
	exchangeFormat: 'form',
	scopes: 'identify client'
};

class SlackAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
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
