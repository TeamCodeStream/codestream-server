// provide service to handle Glip credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'glip',
	host: 'api.ringcentral.com',
	apiHost: 'api.ringcentral.com',
	authPath: 'restapi/oauth/authorize',
	tokenPath: 'restapi/oauth/token',
	exchangeFormat: 'form',
	supportsRefresh: true,
	mockAccessTokenExpiresIn: 3600
};

class GlipAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GlipAuth;
