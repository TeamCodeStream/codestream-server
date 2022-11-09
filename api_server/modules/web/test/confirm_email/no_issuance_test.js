'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const Assert = require('assert');

class NoIssuanceTest extends ConfirmEmailTest {

	get description () {
		return 'should redirect to an error page when sending a confirm change of email request with a token for a user that was not actually issued an email token';
	}

	setOptions () {
		super.setOptions();
		this.userOptions.numRegistered = 2;
	}

	// set the path to use when submitting the request
	setPath (callback) {
		// replace the token with an email token that has the other user's ID in it
		super.setPath(() => {
			const tokenHandler = new TokenHandler(this.apiConfig.sharedSecrets.auth);
			const payload = tokenHandler.decode(this.path.split('=')[1]);
			payload.uid = this.users[1].user.id;
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

module.exports = NoIssuanceTest;
