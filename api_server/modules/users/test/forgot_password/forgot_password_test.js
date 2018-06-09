'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class ForgotPasswordTest extends CodeStreamAPITest {

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
		// send the user's email
		this.data = { email: this.currentUser.email };
		callback();
	}
}

module.exports = ForgotPasswordTest;
