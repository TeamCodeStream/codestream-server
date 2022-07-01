// provide service to handle New Relic via Azure credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT +
	'/api_server/lib/oauth/oauth_module.js');
const NewRelicAzureAuthorizer = require('./newrelic_azure_authorizer');
const NewRelicAzureAdmin = require('./newrelic_azure_admin');

const OAUTH_CONFIG = {
	provider: 'newrelic_azure',
	host: '', // built dynamically on initialization
	authPath: 'oauth2/v2.0/authorize',
	tokenPath: 'oauth2/v2.0/token',
	exchangeFormat: 'query',
	scopes: 'openid profile email',
	additionalAuthCodeParameters: {
		response_mode: 'query',
		prompt: 'login',
	},
	addClientIdToScopes: true,
	mockAccessTokenExpiresIn: 3600,
	supportsRefresh: true,
};

const ROUTES = [
	{
		method: 'post',
		path: 'no-auth/verify-nr-azure-user',
		requestClass: require('./verify_nr_azure_password'),
	},
];

class NewRelicAzureAuth extends OAuthModule {
	constructor(config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;

		const { tenant, authUserFlow } = this.api.config.integrations.newrelic_azure;
		this.oauthConfig.host = `${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${authUserFlow}`;
	}

	services() {
		// return the NewRelic Azure admin as a service for user administration
		return async () => {
			const oauthServices = await super.services()();
			oauthServices.userAdmin = this.userAdmin = new NewRelicAzureAdmin({
				config: this.api.config,
				logger: this.api,
			});
			return oauthServices;
		};
	}

	// get all routes exposed by this module
	getRoutes() {
		return ROUTES;
	}

	// match the given New Relic Azure identity to a CodeStream identity
	async getUserIdentity(options) {
		const authorizer = new NewRelicAzureAuthorizer({ options });
		return authorizer.getNewRelicAzureIdentity(options.accessToken, options.providerInfo);
	}
}

module.exports = NewRelicAzureAuth;
