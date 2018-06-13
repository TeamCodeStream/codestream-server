'use strict';

const ResetPasswordTest = require('./reset_password_test');

class TokenExpiredTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000; // expire the token after one second
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when sending a reset password request with an expired token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	// before the test runs...
	before (callback) {
		// wait till the token expires...
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}
}

module.exports = TokenExpiredTest;
