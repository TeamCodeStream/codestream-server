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
	scopes: 'repo,read:user,user:email,notifications,read:org',
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

	// for SSO providers in the Unified Identity world, we redirect to a New Relic
	// url that calls through to Azure that calls through to the social provider
	getRedirectData (options) {
		if (!options.unifiedIdentityEnabled) {
			return super.getRedirectData(options);
		}
		options.domain = 'github.com';
		return this.api.services.idp.getRedirectData(options);
	}
}

module.exports = GithubAuth;
