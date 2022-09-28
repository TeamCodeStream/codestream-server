'use strict';

const ErrorTest = require('./error_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NotRstTokenTest extends ErrorTest {

	get description () {
		return 'should redirect to an error page when setting a password with a token that is not an rst token';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			this.data.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({email: this.currentUser.email}, 'xyz');
			callback();
		});
	}
}

module.exports = NotRstTokenTest;
