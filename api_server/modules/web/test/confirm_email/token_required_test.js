'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const Assert = require('assert');

class TokenRequiredTest extends ConfirmEmailTest {

	get description () {
		return 'should redirect to an error page when sending a confirm change of email request without providing a token';
	}

	// set the path to use when submitting the request
	setPath (callback) {
		// delete the token
		super.setPath(() => {
			this.path = '/web/confirm-email';
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-error?error=RAPI-1001', 'improper redirect');
	}
}

module.exports = TokenRequiredTest;
