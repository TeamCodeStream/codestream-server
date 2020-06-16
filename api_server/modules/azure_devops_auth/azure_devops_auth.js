// provide service to handle Azure DevOps credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'azuredevops',
	host: 'app.vssps.visualstudio.com',
	apiHost: 'dev.azure.com',
	authPath: 'oauth2/authorize',
	tokenPath: 'oauth2/token',
	exchangeFormat: 'form',
	scopes: 'vso.identity vso.work_write',
	additionalAuthCodeParameters: {
		response_type: 'Assertion',
	},
	additionalTokenParameters: {
		client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
		grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
	},
	additionalRefreshTokenParameters: {
		grant_type: 'refresh_token'
	},
	secretParameterName: 'client_assertion',
	refreshTokenParameterName: 'assertion',
	codeParameterName: 'assertion',
	mockAccessTokenExpiresIn: 3600,
	supportsRefresh: true,
	hasIssues: true,
	needsConfigure: true
};

class AzureDevOpsAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = AzureDevOpsAuth;
