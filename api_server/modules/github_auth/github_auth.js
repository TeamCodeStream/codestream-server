// provide service to handle github credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const GithubAuthorizer = require('./github_authorizer');

const OAUTH_CONFIG = {
	provider: 'github',
	host: 'github.com',
	apiHost: 'api.github.com',
	authPath: 'login/oauth/authorize',
	tokenPath: 'login/oauth/access_token',
	exchangeFormat: 'query',
	scopes: 'repo,read:user,user:email,notifications',
	noGrantType: true,
	hasIssues: true,
	hasCodeHosting: true,
	supportsSignup: true,
	supportsOAuthOrPAT: true
};

class GithubAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given github identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new GithubAuthorizer({ options });
		return await authorizer.getGithubIdentity(
			options.accessToken,
			options.providerInfo
		);
	}
}

module.exports = GithubAuth;
