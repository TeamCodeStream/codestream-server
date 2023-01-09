'use strict';

const RegistrationTest = require('./registration_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class UserExistsTest extends RegistrationTest {

	get description () {
		return `should return the user when registering an email that already exists as an unconfirmed user, under one-user-per-org paradigm`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createExistingUser
		], callback);
	}

	createExistingUser (callback) {
		// create a random user, unconfirmed, and then borrow that user's email for the registration
		this.userFactory.createRandomUser(
			(error, data) => {
				if (error) { return callback(error); }
				this.userId = data.user.id;
				this.data = this.userFactory.getRandomUserData();
				this.data.email = data.user.email;
				this.data._confirmationCheat = this.apiConfig.sharedSecrets.confirmationCheat;
				this.expectedVersion = 2;	// version will be bumped
				callback();
			},
			{
				noConfirm: true
			}
		);
	}

	validateResponse (data) {
		Assert.strictEqual(data.user.id, this.userId, 'ID of returned user not equal to existing user created');
		return super.validateResponse(data);
	}
}

module.exports = UserExistsTest;
