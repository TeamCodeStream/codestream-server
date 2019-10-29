// provide service to handle github credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'github',
	host: 'github.com',
	apiHost: 'api.github.com',
	authPath: 'login/oauth/authorize',
	tokenPath: 'login/oauth/access_token',
	exchangeFormat: 'query',
	scopes: 'repo,read:user',
	noGrantType: true,
	hasIssues: true
};

class GithubAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GithubAuth;
