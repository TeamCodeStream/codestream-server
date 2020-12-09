// handle the GET /no-auth/teams/:teamId/auth-settings request,
// to get auth settings associated with a team (without authentication)

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class GetTeamAuthSettingsRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize() {
		// no authorization necessary
		return true;
	}

	// process the request...
	async process() {
		const teamId = this.request.params.teamId.toLowerCase();
		const team = await this.data.teams.getById(teamId);
		if (!team || team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		const settings = team.get('settings') || {};
		this.responseData = {
			limitAuthentication: settings.limitAuthentication || false,
			authenticationProviders: settings.authenticationProviders || {}
		};
	}

	// describe this route for help
	static describe() {
		return {
			tag: 'auth-settings',
			summary: 'Retrieve authentication settings for a team',
			access: 'No access rules, this very limited data is freely available if the call is made with a valid team ID',
			description: 'Retrieves only the authentication settings',
			input: 'Specify the team ID in the path',
			returns: {
				summary: 'The team settings associated with authentication for that team',
				looksLike: {
					limitAuthentication: '<whether authentication is limited for this team>',
					authenticationProviders: '<hash of allowed providers for authentication>'
				}
			},
			errors: [
				'notFound'
			]
		};
	}
}

module.exports = GetTeamAuthSettingsRequest;
