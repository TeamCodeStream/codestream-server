// provide service to handle MS Teams credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');
const MSTeamsAuthorizer = require('./msteams_authorizer');

const OAUTH_CONFIG = {
	provider: 'msteams',
	host: 'login.microsoftonline.com',
	apiHost: 'graph.microsoft.com/v1.0',
	authPath: 'common/oauth2/v2.0/authorize',
	tokenPath: 'common/oauth2/v2.0/token',
	exchangeFormat: 'form',
	scopes: [
		'User.Read.All',
		'Group.ReadWrite.All',
		'offline_access'
	].join(' '),
	additionalAuthCodeParameters: {
		response_mode: 'query'
	},
	supportsRefresh: true,
	mockAccessTokenExpiresIn: 3600
};

class MSTeamsAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given slack identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new MSTeamsAuthorizer({ options });
		return await authorizer.getMSTeamsIdentity(options.accessToken);
	}
}

module.exports = MSTeamsAuth;
