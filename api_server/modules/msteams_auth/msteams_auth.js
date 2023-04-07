// provide service to handle MS Teams credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'msteams',
	host: 'msteams',
	hasSharing: true
	needsConfigure: true
};

const ROUTES = [];

class MSTeamsAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	getRoutes () {
		return ROUTES;
	}
}

module.exports = MSTeamsAuth;
