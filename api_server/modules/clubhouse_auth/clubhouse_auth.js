// provide service to handle Azure DevOps credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'clubhouse',
	host: 'api.clubhouse.io/api/v3',
	apiHost: 'api.clubhouse.io/api/v3',
	needsConfigure: true,
	hasIssues: true
};

class ClubhouseAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = ClubhouseAuth;
