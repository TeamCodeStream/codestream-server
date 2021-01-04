// provide service to handle github credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'linear',
	host: 'linear.app',
	apiHost: 'api.linear.app',
	useApiHostForTokenExchange: true,
	authPath: 'oauth/authorize',
	tokenPath: 'oauth/token',
	exchangeFormat: 'formQuery',
	scopes: 'read,issues:create',
	hasIssues: true
};

class LinearAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = LinearAuth;
