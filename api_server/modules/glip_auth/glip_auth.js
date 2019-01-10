// provide service to handle Glip credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'glip',
	authUrl: 'https://api.ringcentral.com/restapi/oauth/authorize',
	tokenUrl: 'https://api.ringcentral.com/restapi/oauth/token',
	exchangeFormat: 'form',
	supportsRefresh: true,
	mockAccessTokenExpiresIn: 3600
};

class GlipAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GlipAuth;
