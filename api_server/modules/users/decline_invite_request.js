// handle the PUT /decline-invite/:id request to decline an invite from a company,

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const Indexes = require('./indexes');
const UserDeleter = require('./user_deleter');
const UserPublisher = require('./user_publisher');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class DeclineInviteRequest extends RestfulRequest {

	// authorize the request for the current user©29
	async authorize () {
		// this functionality is not supported if one-user-per-org is not active
		// remove this check when we are fully migrated to ONE_USER_PER_ORG
		if (
			!this.api.modules.modulesByName.users.oneUserPerOrg &&
			!this.request.headers['x-cs-one-user-per-org']
		) {
			throw this.errorHandler.error('notAuthorizedToJoin', { reason: 'one-user-per-org not enabled' });
		}
		this.log('NOTE: decline-invite request allowed in one-user-per-org paradigm');

		// get the company
		this.company = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// get the company's everyone team
		this.team = await this.data.teams.getById(this.company.get('everyoneTeamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't happen
		}

		// get the user record that corresponds to this user's invite
		const matchingUsers = await this.data.users.getByQuery(
			{
				searchableEmail: this.user.get('email').toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);

		this.invitedUser = matchingUsers.find(user => {
			const teamIds = user.get('teamIds') || [];
			return (
				!user.get('deactivated') &&
				!user.get('isRegistered') &&
				teamIds.length === 1 &&
				teamIds[0] === this.team.id
			);
		});
		if (!this.invitedUser) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// process the request
	async process () {
		// declining an invite really just amounts to deleting the record for the invited user
		const userDeleter = new UserDeleter({
			request: this
		});
		this.transforms.updateOp = await userDeleter.deleteModel(this.invitedUser.id);
		this.responseData = {
			user: userDeleter.updateOp
		};
	}

	handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		delete this.responseData.user.$set.searchableEmail; // this is a server-only attribute
		return super.handleResponse();
	}

	// after the user is updated...
	async postProcess () {
		// publish the user to the appropriate broadcaster channel(s)
		await new UserPublisher({
			user: this.invitedUser,
			data: this.responseData.user,
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// describe this route for help
	static describe (module) {
		return {
			tag: 'decline-invite',
			summary: 'Decline the invite to a company',
			access: 'The user must have been invited to the company but not accepted the invite',
			description: 'Effectively deletes the user record representing the invite to the company',
			input: 'Specify the company ID in the path, no other input required',
			returns: {
				summary: 'A user object, with directives to update to the user model, indicating a deactivation',
				looksLike: {
					user: '<directives>'
				}
			},
			publishes: {
				summary: 'The response data will be published on the team channel for everyone team for the company',
			},
			errors: [
				'deleteAuth',
				'notFound'
			]
		};
	}
}

module.exports = DeclineInviteRequest;
