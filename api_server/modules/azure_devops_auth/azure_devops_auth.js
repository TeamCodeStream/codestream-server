// provide service to handle Azure DevOps credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'azuredevops',
	host: 'app.vssps.visualstudio.com',
	apiHost: 'dev.azure.com',
	authPath: 'oauth2/authorize',
	tokenPath: 'oauth2/token',
	exchangeFormat: 'form',
	scopes: 'vso.identity vso.work_full',
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

class AzureDevOpsAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = AzureDevOpsAuth;
