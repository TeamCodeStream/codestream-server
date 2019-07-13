'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class NoIssuanceTest extends SetPasswordTest {

	get description () {
		return 'should redirect with an error if trying to set a password with a token for a user that has not been issued an rst token';
	}

	before (callback) {
		// replace the token with one for a different user, to whom no rst token has actually been issued
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = new TokenHandler(SecretsConfig.auth).generate({ email: this.users[1].user.email }, 'rst');
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/reset/invalid', 'redirected to incorrect url');
	}
}

module.exports = NoIssuanceTest;
