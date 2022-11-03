// handle the "POST /xenv/ensure-user" request, to ensure a user exists across environments,
// either by fetching the user (matched by email), or creating it using the data given

'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules//users/indexes');
const ConfirmHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/confirm_helper');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');

class EnsureUserRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAndAllow();
		await this.getExistingUser();
		this.responseData = await this.createUser();
this.log('EnsureUserREquest returning:' + JSON.stringify(this.responseData, 0, 5));
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				object: ['user']
			}
		});
	}
	
	// find an existing user matching the email passed in
	// under one-user-per-org, the existing user is only found if it is teamless
	async getExistingUser () {
		const { email } = this.request.body.user;
		if (!email) {
			throw this.errorHandler.error('parameterRequired', { info: 'user.email' });
		}
		const users = await this.data.users.getByQuery(
			{
				searchableEmail: decodeURIComponent(email).toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		this.existingUser = users.find(user => {
			return (
				!user.get('deactivated') &&
				(user.get('teamIds') || []).length === 0
			);
		});
	}

	// create a new user based on the attributes passed
	async createUser () {
		// first create the user, unregistered...
		const { email, fullName, username, passwordHash, timeZone, preferences } = this.request.body.user;
		const user = await new UserCreator({
			request: this,
			existingUser: this.existingUser
		}).createUser({
			email,
			fullName,
			username,
			passwordHash,
			timeZone,
			preferences
		});

		// ...then confirm...
		return this.confirmUser(user);
	}

	// confirm an unregistered user
	async confirmUser (user) {
		// call out to a confirmation helper, to finish the confirmation
		// we don't copy any incoming info, except the password hash and full name
		const data = {
			passwordHash: this.request.body.user.passwordHash,
			fullName: this.request.body.user.fullName
		};
		return new ConfirmHelper({
			request: this,
			user: user,
			dontUpdateLastLogin: true,
			dontConfirmInOtherEnvironments: true
		}).confirm(data);
	}

}

module.exports = EnsureUserRequest;
