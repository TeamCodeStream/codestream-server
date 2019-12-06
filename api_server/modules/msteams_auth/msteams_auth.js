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
	mockAccessTokenExpiresIn: 3600,
	hasSharing: false
};

class MSTeamsAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given MS Teams identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new MSTeamsAuthorizer({ options });
		return await authorizer.getMSTeamsIdentity(options.accessToken, options.providerInfo);
	}

	// an access token can be maintained for each MS Teams org
	async getMultiAuthExtraData (info, options) {
		let result;
		try {
			const authorizer = new MSTeamsAuthorizer({ options });
			const joinedTeamsData = await authorizer.getMSTeamsJoinedTeams(info.accessToken, info);
			const meData = await authorizer.getMSTeamsMeData(info.accessToken, info);
			if (meData && joinedTeamsData && joinedTeamsData.teams && joinedTeamsData.teams.length) {
				result = joinedTeamsData.teams.reduce(function (map, obj) {
					map[obj.id] = {
						team_name: obj.displayName,
						team_id: obj.id,
						user_id: meData.me && meData.me.id
					};
					return map;
				}, {});
			}
		}
		catch (error) {
			options.request.warn('Request to MSTeams API failed: ' + error.message);
			throw error;
		}

		return result;
	}
}

module.exports = MSTeamsAuth;
