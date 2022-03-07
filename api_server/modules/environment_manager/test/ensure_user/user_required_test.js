'use strict';

const EnsureExistingUserTest = require('./ensure_existing_user_test');

class UserRequiredTest extends EnsureExistingUserTest {

	get description () {
		return 'should return an error when submitting a cross-environment request to ensure a user without providing a user object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'user'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email from the body
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.user;
			callback();
		});
	}
}

module.exports = UserRequiredTest;
