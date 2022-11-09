'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const Assert = require('assert');

class InvalidTokenTest extends ConfirmEmailTest {

	get description () {
		return 'should redirect to an error page when sending a confirm change of email request with a totally invalid token string';
	}

	// set the path to use when submitting the request
	setPath (callback) {
		super.setPath(() => {
			// replace the token with a garbage token
			this.path = '/web/confirm-email?t=abcxyz';
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-error?error=AUTH-1002', 'improper redirect');
	}
}

module.exports = InvalidTokenTest;
