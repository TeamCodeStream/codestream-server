// provide service to handle bitbucket credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'bitbucket',
	host: 'bitbucket.org',
	apiHost: 'api.bitbucket.org/2.0',
	authPath: 'site/oauth2/authorize',
	tokenPath: 'site/oauth2/access_token',
	exchangeFormat: 'form',
	scopes: 'account team repository issue:write',
	appIdInAuthorizationHeader: true,
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true,
	hasIssues: true
};

class BitbucketAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = BitbucketAuth;
