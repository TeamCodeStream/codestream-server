// handle the "POST /xenv/confirm-user" request, to confirm a given user via email, for internal use
// between environments

'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules//users/indexes');
const ConfirmHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/confirm_helper');
const UserPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_publisher');

class ConfirmUserRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAndAllow();
		await this.getUser();
		if (!this.user) { return; }
		await this.confirmUser();
		await this.removeSignupTokens();
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['email'],
			},
			optional: {
				string: ['username', 'password', 'passwordHash']
			}
		});
	}

	// get the referenced user, if it exists
	async getUser () {
		// get the user by passed-in email
		this.user = await this.data.users.getOneByQuery(
			{
				searchableEmail: this.request.body.email.toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		if (!this.user) { return; }

		// ignore deactivated users, or users that are already registered
		if (this.user.get('deactivated') || this.user.get('isRegistered')) {
			delete this.user;
		}
	}

	// confirm the referenced user
	async confirmUser () {
		// call out to a confirmation helper, to finish the confirmation
		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.user,
			dontUpdateLastLogin: true,
			dontConfirmInOtherEnvironments: true
		}).confirm(this.request.body);
	}

	// remove any old signup tokens associated with this user
	async removeSignupTokens () {
		await this.api.services.signupTokens.removeInviteCodesByUserId(this.user.id);
	}

	// after the request returns a response....
	async postProcess () {
		// publish the now-registered-and-confirmed user to all the team members
		await this.publishUserToTeams();
	}

	// publish the now-registered-and-confirmed user to all the team members,
	// over the team channel
	async publishUserToTeams () {
		if (!this.user) { return; }
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject({ request: this }),
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}
}

module.exports = ConfirmUserRequest;
