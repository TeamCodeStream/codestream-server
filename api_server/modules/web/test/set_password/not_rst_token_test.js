'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class NotRstTokenTest extends SetPasswordTest {

	get description () {
		return 'should redirect with an error if trying to set a password with a token that is not an rst token';
	}

	before (callback) {
		// replace the token with a new one, but not of type "rst"
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = new TokenHandler(SecretsConfig.auth).generate({email: this.currentUser.email}, 'xyz');
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/reset/invalid', 'redirected to incorrect url');
	}
}

module.exports = NotRstTokenTest;
