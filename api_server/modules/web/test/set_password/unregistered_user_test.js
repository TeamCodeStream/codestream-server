'use strict';

const ErrorTest = require('./error_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class UnregisteredUserTest extends ErrorTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		this.userOptions.numUnregistered = 1;
	}

	get description () {
		return 'should redirect to an error page when setting a password with a token for a user that is not registered';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			// have to force creating this token, since the forgot-password endpoint won't actually return a token for an unregistered user
			this.data.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({ email: this.users[0].user.email }, 'rst');
			callback();
		});
	}
}

module.exports = UnregisteredUserTest;
