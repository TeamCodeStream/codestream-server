// provide service to handle bitbucket credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const BitbucketAuthorizer = require('./bitbucket_authorizer');

const OAUTH_CONFIG = {
	provider: 'bitbucket',
	host: 'bitbucket.org',
	apiHost: 'api.bitbucket.org/2.0',
	authPath: 'site/oauth2/authorize',
	tokenPath: 'site/oauth2/access_token',
	exchangeFormat: 'form',
	scopes: 'account team repository issue:write pullrequest:write',
	appIdInAuthorizationHeader: true,
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true,
	supportsSignup: true,
	hasIssues: true,
	hasCodeHosting: true
};

class BitbucketAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given Bitbucket identity to a CodeStream identity
	async getUserIdentity(options) {
		const authorizer = new BitbucketAuthorizer({ options });
		return await authorizer.getBitbucketIdentity(
			options.accessToken,
			options.providerInfo
		);
	}
}

module.exports = BitbucketAuth;
