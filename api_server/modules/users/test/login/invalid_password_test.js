'use strict';

var LoginTest = require('./login_test');

class InvalidPasswordTest extends LoginTest {

	get description () {
		return 'should return error when invalid password provided';
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
