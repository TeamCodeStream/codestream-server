// provide service to handle github credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'github',
	authUrl: 'https://github.com/login/oauth/authorize',
	tokenUrl: 'https://github.com/login/oauth/access_token',
	exchangeFormat: 'query',
	scopes: 'repo,user',
	noGrantType: true
};

class GithubAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GithubAuth;
