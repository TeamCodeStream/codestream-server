// provide service to handle GitLab Enterprise credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'gitlab_enterprise',
	host: 'gitlab/enterprise',
	apiHost: 'gitlab.com/api/v4',
	authPath: 'oauth/authorize',
	tokenPath: 'oauth/token',
	exchangeFormat: 'query',
	scopes: 'api',
	mockAccessTokenExpiresIn: 7200,
	supportsRefresh: true,
	accessTokenExpiresIn: 7200,
	hasIssues: true,
	forEnterprise: true,
	authCompletePage: 'gitlab'
};

class GitlabEnterpriseAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = GitlabEnterpriseAuth;
