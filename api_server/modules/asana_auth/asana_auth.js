// provide service to handle asana credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'asana',
	host: 'app.asana.com',
	apiHost: 'app.asana.com',
	authPath: '-/oauth_authorize',
	tokenPath: '-/oauth_token',
	exchangeFormat: 'form',
	accessTokenExpiresIn: 3600,
	supportsRefresh: true,
	hasIssues: true
};

class AsanaAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = AsanaAuth;
