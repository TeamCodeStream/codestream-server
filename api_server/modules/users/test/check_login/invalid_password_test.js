'use strict';

const CheckLoginTest = require('./check_login_test');

class InvalidPasswordTest extends CheckLoginTest {

	get description () {
		return 'should return error when invalid password provided to login check';
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	// before the test runs...
	before (callback) {
		// alter the password to force a mismatch
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.password += 'x';
			callback();
		});
	}
}

module.exports = InvalidPasswordTest;
