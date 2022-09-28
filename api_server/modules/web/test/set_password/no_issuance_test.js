'use strict';

const ErrorTest = require('./error_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NoIssuanceTest extends ErrorTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should redirect to an error page when setting a password with a token for a user that was not actually issued a reset token';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			this.data.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({ email: this.users[1].user.email }, 'rst');
			callback();
		});
	}
}

module.exports = NoIssuanceTest;
