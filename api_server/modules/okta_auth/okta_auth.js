// provide service to handle okta credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');
const OktaAuthorizer = require('./okta_authorizer');

const OAUTH_CONFIG = {
	provider: 'okta',
	host: 'okta.com',
	apiHost: 'okta.com',
	authPath: 'oauth2/v1/authorize',
	tokenPath: 'oauth2/v1/token',
	exchangeFormat: 'formQuery',
	scopes: 'openid email profile',
	appIdInAuthorizationHeader: true,
	supportsSignup: true
};

class OktaAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// override OAuthModule getClientInfo to require an orgId
	getClientInfo (options) {
		if (!options.orgId) {
			throw options.request.errorHandler.error('orgIdRequired');
		}
		return super.getClientInfo(options);
	}

	// match the given okta identity to a CodeStream identity
	async getUserIdentity (options) {
		options.config = this.oauthConfig;
		const authorizer = new OktaAuthorizer({ options });
		return await authorizer.getOktaIdentity(
			options.accessToken,
			options.providerInfo
		);
	}
}

module.exports = OktaAuth;
