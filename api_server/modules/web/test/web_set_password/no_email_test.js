'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NoEmailTest extends SetPasswordTest {

	get description () {
		return 'should redirect to an error page when requesting a set password page with a token with no email in the payload';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			this.apiRequestOptions = {
				expectRedirect: true,
				noJsonInResponse: true
			};
			const token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({}, 'rst');
			this.path = `/web/user/password?token=${token}`;
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/user/password/reset/invalid', 'incorrect redirect');
	}
}

module.exports = NoEmailTest;
