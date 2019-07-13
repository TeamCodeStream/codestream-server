'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class NoTokenTest extends SetPasswordTest {

	get description () {
		return 'should redirect with an error if trying to set a password without providing a token';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.token;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/reset/invalid', 'redirected to incorrect url');
	}
}

module.exports = NoTokenTest;
