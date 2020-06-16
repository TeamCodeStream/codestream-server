'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class NewUserInviteTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'an unregistered user should get analytics related updates when invited on-the-fly from a codemark created with a post';
	}

	// actually run the test... here we override the base class test run, and
	// perform a follow-up fetch of the user object that should have been modified
	// by the invitation
	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.registerUser,
			this.confirmUser,
			this.verifyUserUpdate
		], callback);
	}

	// register the created user, since they were unregistered, and we need
	// an access token for them to get their me-object and verify
	registerUser (callback) {
		this.doApiRequest({
			method: 'post',
			path: '/no-auth/register',
			data: {
				email: this.data.addedUsers[0],
				username: RandomString.generate(12),
				password: RandomString.generate(12),
				_confirmationCheat: this.apiConfig.secrets.confirmationCheat,	// gives us the confirmation code in the response
				_forceConfirmation: true								// this forces confirmation even if not enforced in environment
			}
		}, (error, response) => {
			if (error) { return callback(error); }
			this.registeredUser = response.user;
			callback();
		});
	}

	// confirm the created user's registration
	confirmUser (callback) {
		this.doApiRequest({
			method: 'post',
			path: '/no-auth/confirm',
			data: {
				email: this.registeredUser.email,
				confirmationCode: this.registeredUser.confirmationCode
			}
		}, (error, response) => {
			if (error) { return callback(error); }
			this.confirmedUser = response.user;
			callback();
		});
	}

	// verify that the created user was properly updated
	verifyUserUpdate (callback) {
		const user = this.confirmedUser;
		Assert(user.internalMethod === 'invitation', 'internalMethod not correct');
		Assert(user.internalMethodDetail === this.currentUser.user.id, 'internalMethodDetail not set to inviter');
		Assert(user.numInvites === 1, 'numInvites not set to 1');
		callback();
	}
}

module.exports = NewUserInviteTest;
