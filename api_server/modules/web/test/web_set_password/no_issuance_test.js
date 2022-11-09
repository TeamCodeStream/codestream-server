'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NoIssuanceTest extends SetPasswordTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should redirect to an error page when requesting a set password page with a token for a user that was not actually issued a reset token';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			this.apiRequestOptions = {
				expectRedirect: true,
				noJsonInResponse: true
			};

			const token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({ email: this.users[1].user.email }, 'rst');
			this.path = `/web/user/password?token=${token}`;
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/user/password/reset/invalid', 'incorrect redirect');
	}
}

module.exports = NoIssuanceTest;
