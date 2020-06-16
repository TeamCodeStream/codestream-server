// handle the "GET /no-auth/invite-info" request to get the info associated with an invite code

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const UserErrors = require('./errors');

class InviteInfoRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// no authorization necessary
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.findToken();			// look for the signup token provided
		await this.getUser();			// get the associated user
		await this.getTeam();			// get the team the user was invited to

		this.responseData = {
			teamId: this.tokenInfo.teamId,
			teamName: this.team.get('name'),
			email: this.user.get('email')
		};
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['code']
				}
			}
		);
	}

	async findToken () {
		const info = await this.api.services.signupTokens.find(
			this.request.query.code,
			{ requestId: this.request.id }
		);
		if (!info) {
			throw this.errorHandler.error('noUserId');
		}
		else if (info.expired) {
			throw this.errorHandler.error('tokenExpired');
		}
		else {
			this.tokenInfo = info;
		}
	}

	// get the user associated with the ID
	async getUser () {
		this.user = await this.data.users.getById(this.tokenInfo.userId);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// get the team the user was invited to
	async getTeam () {
		this.team = await this.data.teams.getById(this.tokenInfo.teamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'invite-info',
			summary: 'Get the info associated with an invite code',
			access: 'No standard access rules',
			description: 'Use this API fetch the team ID and email associated with an invite code that was generated when a user was invited to a team, and sent in the invite email',
			input: {
				summary: 'Specify the invite code as a request query parameter',
				looksLike: {
					'code*': '<Invite code sent in the invite email>'
				}
			},
			returns: {
				summary: 'Returns an object containing the email of the invited user, and the ID and name of the team they were invited to',
				looksLike: {
					email: '<Email of the invited user>',
					teamId: '<ID of the team the user was invited to>',
					teamName: '<Name of the team the user was invited to>'
				}
			},
			errors: [
				'parameterRequired',
				'tokenInvalid',
				'tokenExpired',
				'notFound'
			]
		};
	}
}

module.exports = InviteInfoRequest;
