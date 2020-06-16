// provide service to handle jira credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'jira',
	host: 'auth.atlassian.com',
	apiHost: 'api.atlassian.com',
	authPath: 'authorize',
	tokenPath: 'oauth/token',
	exchangeFormat: 'json',
	scopes: 'read:jira-user read:jira-work write:jira-work offline_access',
	additionalAuthCodeParameters: {
		audience: 'api.atlassian.com',
		prompt: 'consent'
	},
	mockAccessTokenExpiresIn: 3600,
	supportsRefresh: true,
	hasIssues: true
};

class JiraAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = JiraAuth;
