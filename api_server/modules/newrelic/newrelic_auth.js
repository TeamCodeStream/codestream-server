// provide service to handle New Relic credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'newrelic',
	host: 'newrelic.com',
	needsConfigure: true
};

class NewRelicAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = NewRelicAuth;
