// provide service to handle Jenkins credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'jenkins',
	host: 'jenkins',
	hasBuilds: true,
	needsConfigure: true
};

const ROUTES = [];

class JenkinsAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	getRoutes () {
		return ROUTES;
	}
}

module.exports = JenkinsAuth;
