'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const Assert = require('assert');

class MissingInPayloadTest extends ConfirmEmailTest {

	get description () {
		return `should redirect to an error page when sending a confirm change of email request with a token that has no ${this.parameter}`;
	}

	// set the path to use when submitting the request
	setPath (callback) {
		// replace the token with a token that has no email in it
		super.setPath(() => {
			const tokenHandler = new TokenHandler(this.apiConfig.sharedSecrets.auth);
			const payload = tokenHandler.decode(this.path.split('=')[1]);
			delete payload[this.parameter];
			const token = tokenHandler.generate(payload, 'email');
			this.path = `/web/confirm-email?t=${token}`;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-error?error=AUTH-1002', 'improper redirect');
	}
}

module.exports = MissingInPayloadTest;
