'use strict';

const ErrorTest = require('./error_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class UserNotFoundTest extends ErrorTest {

	get description () {
		return 'should redirect to an error page when setting a password with a token that has an unknown email';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			const email = this.userFactory.randomEmail();
			this.data.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({ email }, 'rst');
			callback();
		});
	}
}

module.exports = UserNotFoundTest;
