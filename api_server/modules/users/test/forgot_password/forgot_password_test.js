'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class ForgotPasswordTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should accept a reset password request';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/forgot-password';
	}
    
	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// send the user's email
			this.data = { email: this.users[0].user.email };
			callback();
		});
	}
}

module.exports = ForgotPasswordTest;
