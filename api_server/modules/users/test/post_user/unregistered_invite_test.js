'use strict';

const PostUserTest = require('./post_user_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class UnregisteredInviteTest extends PostUserTest {

	get description () {
		return 'an unregistered user should get analytics related updates when invited';
	}

	// actually run the test... here we override the base class test run, and
	// perform a follow-up fetch of the user object that should have been modified
	// by the invitation
	run (callback) {
		this.firstRun = true;
		BoundAsync.series(this, [
			super.run,	// just to be sure we'll actually run twice, to get numInvites to increment twice
			super.run,
			this.registerUser,
			this.confirmUser,
			this.verifyUserUpdate
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		if (!this.firstRun) {
			this.firstInviteType = 'invitation';
			this.lastInviteType = 'reinvitation';	// this sets the right condition for validating the response in the second test run
		}
		else {
			this.firstRun = false;
		}
		super.validateResponse(data);
	}

	// register the created user, since they were unregistered, and we need
	// an access token for them to get their me-object and verify
	registerUser (callback) {
		this.doApiRequest({
			method: 'post',
			path: '/no-auth/register',
			data: {
				email: this.data.email,
				username: RandomString.generate(12),
				password: RandomString.generate(12),
				_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat,	// gives us the confirmation code in the response
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
		Assert(user.numInvites === 2, 'numInvites not set to 2');
		callback();
	}
}

module.exports = UnregisteredInviteTest;
