// handle the "POST /no-auth/provider-action/:provider" request to handle a user action
// initiated for a particular provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class ProviderActionRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, authorization is handled by the processing logic
	}

	// process the request...
	async process () {
		return;
		/*
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		await this.getUser() &&			// get the user that initiated this action
		await this.getTeam() &&			// get the team the user is on, matching the identity
		await this.getCompany() &&		// get the company the team belongs to
		await this.sendTelemetry();		// send telemetry for this action
		*/
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		/*
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['payload']
				}
			}
		);*/

	}

	/*
	// get the user that initiated this action
	async getUser () {
		this.provider = this.request.params.provider.toLowerCase();
		this.providerUserId = this.request.body.payload.user &&
			this.request.body.payload.user.id;
		if (!this.providerUserId) {
			this.log(`${this.provider} did not give a user ID`);
			return false;
		}

		const users = await this.data.users.getByQuery(
			{ providerIdentities: `${this.provider}::${this.providerUserId}` },
			{ hint: UserIndexes.byProviderIdentities } 
		);
		if (users.length === 0) {
			this.log(`CodeStream user with ${this.provider} identity matching ${this.providerUserId} was not found`);
			return false;
		}
		else if (users.length > 0) {
			this.log(`Multiple CodeStream users found matching ${this.provider} identity ${this.providerUserId}`);
			return false;
		}

		this.user = users[0];
		return true;
	}

	// get the team the user is on, matching the identity
	async getTeam () {
		const teamIds = this.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			return false;
		}

		this.providerTeamId = this.request.body.payload.team &&
			this.request.body.payload.team.id;
		if (!this.providerTeamId) {
			this.log(`${this.provider} did not give a team ID`);
			return false;
		}

		const teamIdentity = `${this.provider}::${this.providerTeamId}`;
		const teams = await this.data.teams.getByIds(teamIds);
		this.team = teams.find(team => {
			return providerIdentities.find(id => id === teamIdentity);
		});
		if (!this.team) {
			this.log(`CodeStream team with ${this.provider} identity matching ${this.providerTeamId} was not found`);
			return false;
		}

		return true;
	}

	// get the company that owns the team
	async getCompany () {
		this.company = await this.data.companies.get(this.team.get('companyId'));
	}
	*/
	
	// describe this route for help
	static describe () {
		return {
			/*
			tag: 'provider-connect',
			summary: 'Connects a user from a third-party provider to CodeStream',
			access: 'No authorization needed, authorization is handled within the request logic',
			description: 'Once third-party authorization is complete, call this request to register the user with CodeStream; the user will be assumed to be confirmed after a basic check of the provider credentials with the provider in question',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'providerInfo*': '<Provider info with credentials and other info gleaned from the third-party auth process>',
					'signupToken': '<Client-generated signup token, passed to signup on the web, to associate an IDE session with the new user>'
				}
			},
			returns: {
				summary: 'Returns a user object',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			publishes: {
				summary: 'If the user was invited and being put on a new team, or if the user was already on a teams and was confirmed with this request, an updated user object will be published to the team channel for each team the user is on.',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'usernameNotUnique',
				'exists',
				'validation',
				'unknownProvider',
				'invalidProviderCredentials',
				'duplicateProviderAuth',
				'inviteTeamMismatch'
			]
			*/
		};
	}
}

module.exports = ProviderActionRequest;
