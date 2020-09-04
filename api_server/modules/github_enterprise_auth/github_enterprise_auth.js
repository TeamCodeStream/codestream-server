// provide service to handle GitHub Enterprise credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'github_enterprise',
	host: 'github/enterprise',
	authPath: 'login/oauth/authorize',
	tokenPath: 'login/oauth/access_token',
	exchangeFormat: 'query',
	scopes: 'repo,read:user,user:email,notifications',
	noGrantType: true,
	hasIssues: true,
	hasCodeHosting: true,
	forEnterprise: true,
	authCompletePage: 'github'
};

class GithubEnterpriseAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GithubEnterpriseAuth;
