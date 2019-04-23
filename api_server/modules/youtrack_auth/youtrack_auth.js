// provide service to handle YouTrack credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'youtrack',
	host: 'youtrack.com',
	authPath: 'hub/api/rest/oauth2/auth',
	scopes: 'YouTrack',
	additionalAuthCodeParameters: {
		request_credentials: 'default',
		response_type: 'token'
	},
	noExchange: true,
	tokenFromFragment: 'access_token',
	hasIssues: true,
	enterpriseOnly: true
};

class YouTrackAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = YouTrackAuth;
