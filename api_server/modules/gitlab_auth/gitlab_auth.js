// provide service to handle gitlab credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'gitlab',
	host: 'gitlab.com',
	apiHost: 'gitlab.com/api/v4',
	authPath: 'oauth/authorize',
	tokenPath: 'oauth/token',
	exchangeFormat: 'query',
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true,
	hasIssues: true
};

class GitlabAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GitlabAuth;
