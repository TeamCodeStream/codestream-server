'use strict';

const EnsureExistingUserTest = require('./ensure_existing_user_test');
const Assert = require('assert');

class CreateUserTest extends EnsureExistingUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 1;
	}

	get description () {
		return 'should create a new registered user when ensuring a user across environments and the user does not exist';
	}

	getExpectedFields () {
		return null;

	}
	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// in order to simulate user data coming from another server, we'll use the existing
			// "current" user, but change email to a random email, this should create a user with
			// the same user data, but with the randomly created email
			this.data.user = {...this.currentUser.user};
			this.data.user.email = this.userFactory.randomEmail();
			this.data.user.searchableEmail = this.data.user.email.toLowerCase();
			callback();
		});
	}

	validateResponse (data) {
		Assert.notStrictEqual(data.user.id, this.currentUser.user.id, 'current user was returned');
		Assert.strictEqual(data.user.email, this.data.user.email, 'user created does not have the correct email');
	}
}

module.exports = CreateUserTest;
