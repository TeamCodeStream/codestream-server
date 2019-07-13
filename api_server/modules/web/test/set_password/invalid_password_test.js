'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class InvalidPasswordTest extends SetPasswordTest {

	get description () {
		return 'should render with an error message when setting a password and specifying an invalid password';
	}

	// before the test runs...
	before (callback) {
		// change the password to something invalid
		super.before(error => {
			if (error) { return callback(error); }
			this.data.password = 'x';
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.indexOf('password must be at least six characters') !== -1, 'error message was not rendered');
	}
}

module.exports = InvalidPasswordTest;
