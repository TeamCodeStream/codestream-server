'use strict';

const ResetPasswordTest = require('./reset_password_test');

class InvalidTokenTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when sending a reset password request with a totally invalid token string';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// set the data to use when resetting password
	setData (callback) {
		super.setData(() => {
			// replace the token with a garbage token
			this.passwordData.t = 'abcxyz';
			callback();
		});
	}
}

module.exports = InvalidTokenTest;
