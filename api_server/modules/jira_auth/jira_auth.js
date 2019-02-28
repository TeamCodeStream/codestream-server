// provide service to handle jira credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'jira',
	appOrigin: 'https://auth.atlassian.com',
	authPath: 'authorize',
	tokenPath: 'oauth/token',
	exchangeFormat: 'json',
	scopes: 'read:jira-user read:jira-work write:jira-work offline_access',
	additionalAuthCodeParameters: {
		audience: 'api.atlassian.com',
		prompt: 'consent'
	},
	mockAccessTokenExpiresIn: 3600,
	supportsRefresh: true
};

class JiraAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = JiraAuth;
