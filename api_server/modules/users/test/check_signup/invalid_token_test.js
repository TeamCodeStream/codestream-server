'use strict';

const CheckSignupTest = require('./check_signup_test');
const UUID = require('uuid/v4');

class InvalidTokenTest extends CheckSignupTest {

	get description () {
		return 'should return an error when sending a check signup request with an invalid signup token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1006'
		};
	}

	// before the test runs...
	before (callback) {
		// change the token to a properly formed token, but not a recognized one
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = UUID();
			callback();
		});
	}
}

module.exports = InvalidTokenTest;
