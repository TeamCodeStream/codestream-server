// provide service to handle bitbucket credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'bitbucket',
	host: 'bitbucket.org',
	authPath: 'site/oauth2/authorize',
	tokenPath: 'site/oauth2/access_token',
	exchangeFormat: 'form',
	scopes: 'account team repository issue:write',
	appIdInAuthorizationHeader: true,
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true
};

class BitbucketAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = BitbucketAuth;
