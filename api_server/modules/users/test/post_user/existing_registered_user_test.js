'use strict';

const PostUserTest = require('./post_user_test');
const Assert = require('assert');

class ExistingRegisteredUserTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'should return the user when inviting a user that already exists and is registered';
	}

	// validate the response to the test request
	validateResponse (data) {
		const user = data.user;
		Assert(user.id !== this.existingUserData.user.id, 'user returned should be different than invited user, under one-user-per-org');
		Assert(!user.isRegistered, 'invited user should not be registered, under one-user-per-org');
		super.validateResponse(data);
	}
}

module.exports = ExistingRegisteredUserTest;
