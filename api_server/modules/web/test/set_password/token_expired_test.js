'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class TokenExpiredTest extends SetPasswordTest {

	constructor (options) {
		super(options);
		this.tokenExpiresIn = 1000;
	}

	get description () {
		return 'should redirect with an error if trying to set a password with an expired token';
	}

	before (callback) {
		// wait until token expires before proceeding with the test
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/reset/invalid', 'redirected to incorrect url');
	}
}

module.exports = TokenExpiredTest;
