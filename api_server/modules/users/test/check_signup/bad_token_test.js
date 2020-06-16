'use strict';

const CheckSignupTest = require('./check_signup_test');

class BadTokenTest extends CheckSignupTest {

	get description () {
		return 'should return an error when sending a check signup request with a bad signup token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1006'
		};
	}

	// before the test runs...
	before (callback) {
		// change the token to garbage
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = 'abcxyz';
			callback();
		});
	}
}

module.exports = BadTokenTest;
