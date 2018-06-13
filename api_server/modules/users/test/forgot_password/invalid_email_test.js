'use strict';

const ForgotPasswordTest = require('./forgot_password_test');

class InvalidEmailTest extends ForgotPasswordTest {

	get description () {
		return 'should return an error when requesting a password reset and a bad email is provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'email'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute an invalid email
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = 'xyz';
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
