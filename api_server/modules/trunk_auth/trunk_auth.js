'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'trunk',
	host: 'trunk.io',
	needsConfigure: false
};

const ROUTES = [];

class TrunkAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	getRoutes () {
		return ROUTES;
	}
}

module.exports = TrunkAuth;