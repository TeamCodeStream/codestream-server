// provide service to handle bitbucket server credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'bitbucket_server',
	host: 'bitbucket/server',
	apiHost: 'api.bitbucket.org/2.0',
	authPath: 'site/oauth2/authorize',
	tokenPath: 'site/oauth2/access_token',
	exchangeFormat: 'form',
	scopes: 'projects:read repositories:write',
	appIdInAuthorizationHeader: true,
	forEnterprise: true,
	//hasIssues: true,
	hasCodeHosting: true
};

class BitbucketServerAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = BitbucketServerAuth;
