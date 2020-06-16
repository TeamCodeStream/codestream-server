'use strict';

var ConfirmationTest = require('./confirmation_test');

class NoPasswordTest extends ConfirmationTest {

	get description () {
		return 'should return an error when no password passed in confirmation and user has no password yet';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'password'
		};
	}

	// before the test runs...
	before (callback) {
		// indicate to suppress the password when we do the initial register call ... so
		// when they try to confirm (and still don't set a password), the call fails
		this.userOptions = {
			noPassword: true
		};
		super.before(callback);
	}
}

module.exports = NoPasswordTest;
