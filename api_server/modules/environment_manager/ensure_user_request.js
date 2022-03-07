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

		let fetched = false, created = false;
		while (!fetched) { 
			const { email } = this.request.body.user;
			if (!email) {
				throw this.errorHandler.error('parameterRequired', { info: 'user.email' });
			}

			const user = await this.data.users.getOneByQuery(
				{
					searchableEmail: decodeURIComponent(email).toLowerCase()
				},
				{
					hint: UserIndexes.bySearchableEmail
				}
			);
			if (user) {
				// if the user exists but isn't confirmed, we confirm them automatically
				if (!user.get('isRegistered')) {
					this.responseData = await this.confirmUser(user);
				} else {
					this.responseData = { 
						user: user.attributes,
						accessToken: ((user.get('accessTokens') || {}).web || {}).token
					};
				}
				fetched = true;
			} else if (created) {
				// something went wrong, shouldn't happen, but better than an infinite loop
				throw this.errorHandler.error('createAuth', { reason: 'user not created' });
			} else {
				await this.createUser();
				await this.persist(); // make sure created user is saved to database, not just cached
				created = true;
			}
		}
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				object: ['user']
			}
		});
	}
	
	// create a new user based on the attributes passed
	async createUser () {
		// first create the user, unregistered...
		const { email, fullName, username, passwordHash, timeZone, preferences } = this.request.body.user;
		const user = await new UserCreator({
			request: this
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
		// we don't copy any incoming info, except the password hash
		const data = {
			passwordHash: this.request.body.user.passwordHash
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
