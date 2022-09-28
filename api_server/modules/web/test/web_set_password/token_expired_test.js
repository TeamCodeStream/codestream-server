'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class TokenExpiredTest extends SetPasswordTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000; // expire the token after one second
	}

	get description () {
		return 'should redirect to an error page when requesting a set password page with an expired token';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			this.apiRequestOptions = {
				expectRedirect: true,
				noJsonInResponse: true
			};
			setTimeout(callback, 2000);
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/user/password/reset/invalid', 'incorrect redirect');
	}
}

module.exports = TokenExpiredTest;
