// provide service to handle slack credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');
const SlackAuthorizer = require('./slack_authorizer');

const OAUTH_CONFIG = {
	provider: 'slack',
	host: 'slack.com',
	apiHost: 'slack.com/api',
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
		return await new SlackAuthorizer({ providerInfo, options }).exchangeAndAuthorize();
	}

	validateChannelName (name) {
		if (name.match(/[^a-z0-9-_[\]{}\\/]/)) {
			return 'illegal characters in channel name';
		}
		if (name.length > 21) {
			return 'name must be no longer than 21 characters';
		}
	}

	// match the given slack identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new SlackAuthorizer({ options });
		return await authorizer.getSlackIdentity(options.accessToken);
	}
}

module.exports = SlackAuth;
