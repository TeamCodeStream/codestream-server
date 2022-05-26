// provide service to handle New Relic via Azure credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const NewRelicAzureAuthorizer = require('./newrelic_azure_authorizer');

const OAUTH_CONFIG = {
	provider: 'newrelic_azure',
	host: 
		//'newrelicstaging.b2clogin.com/newrelicstaging.onmicrosoft.com/B2C_1_Codestream_signupsignin', // New Relic staging app
		'cstrykernr.b2clogin.com/cstrykernr.onmicrosoft.com/B2C_1_SignupSignin', // cstrykernr, for local testing
	authPath: 'oauth2/v2.0/authorize',
	tokenPath: 'oauth2/v2.0/token',
	exchangeFormat: 'query',
	scopes: 'openid profile email',
	additionalAuthCodeParameters: {
		response_mode: 'query',
		prompt: 'login'
	},
	addClientIdToScopes: true,
	mockAccessTokenExpiresIn: 3600,
	supportsRefresh: true,
};

class NewRelicAzureAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given New Relic Azure identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new NewRelicAzureAuthorizer({ options });
		return authorizer.getNewRelicAzureIdentity(
			options.accessToken,
			options.providerInfo
		);
	}
}

module.exports = NewRelicAzureAuth;
