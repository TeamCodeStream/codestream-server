// provide service to handle gitlab credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const GitlabAuthorizer = require('./gitlab_authorizer');

const OAUTH_CONFIG = {
	provider: 'gitlab',
	host: 'gitlab.com',
	apiHost: 'gitlab.com/api/v4',
	authPath: 'oauth/authorize',
	tokenPath: 'oauth/token',
	exchangeFormat: 'query',
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true,
	supportsSignup: true,
	hasIssues: true,
	hasCodeHosting: true,
	supportsOAuthOrPAT: true,
	scopes: 'api'
};

class GitlabAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given GitLab identity to a CodeStream identity
	async getUserIdentity(options) {
		const authorizer = new GitlabAuthorizer({ options });
		return await authorizer.getGitlabIdentity(
			options.accessToken,
			options.providerInfo
		);
	}
}

module.exports = GitlabAuth;
