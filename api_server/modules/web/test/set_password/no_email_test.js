'use strict';

const ErrorTest = require('./error_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NoEmailTest extends ErrorTest {

	get description () {
		return 'should redirect to an error page when setting a password with a token with no email in the payload';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			this.data.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({}, 'rst');
			callback();
		});
	}
}

module.exports = NoEmailTest;
