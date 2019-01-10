// provide service to handle gitlab credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'gitlab',
	authUrl: 'https://gitlab.com/oauth/authorize',
	tokenUrl: 'https://gitlab.com/oauth/token',
	exchangeFormat: 'query',
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true
};

class GitlabAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GitlabAuth;
