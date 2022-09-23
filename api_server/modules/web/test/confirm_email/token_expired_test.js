'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const Assert = require('assert');

class TokenExpiredTest extends ConfirmEmailTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000; // expire the token after one second
	}

	get description () {
		return 'should redirect to an error page when sending a confirm change of email request with an expired token';
	}

	// before the test runs...
	before (callback) {
		// wait till the token expires...
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-error?error=AUTH-1005', 'improper redirect');
	}
}

module.exports = TokenExpiredTest;
