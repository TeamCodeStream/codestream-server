// provide service to handle MS Teams credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'msteams',
	appOrigin: 'https://login.microsoftonline.com',
	authPath: 'common/oauth2/v2.0/authorize',
	tokenPath: 'common/oauth2/v2.0/token',
	exchangeFormat: 'form',
	scopes: 'https://graph.microsoft.com/mail.read offline_access',
	additionalAuthCodeParameters: {
		response_mode: 'query',
		prompt: 'consent'
	},
	supportsRefresh: true,
	mockAccessTokenExpiresIn: 3600
};

class MSTeamsAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = MSTeamsAuth;
