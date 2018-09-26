'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class ForgotPasswordTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
		delete this.teamOptions.inviterIndex;
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
			this.data = { email: this.currentUser.user.email };
			callback();
		});
	}
}

module.exports = ForgotPasswordTest;
