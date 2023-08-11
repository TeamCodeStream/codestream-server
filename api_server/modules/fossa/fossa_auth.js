'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'fossa',
	host: 'fossa.com',
	needsConfigure: true
};

const ROUTES = [];

class FossaAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	getRoutes () {
		return ROUTES;
	}
}

module.exports = FossaAuth;