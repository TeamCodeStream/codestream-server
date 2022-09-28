'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class ErrorTest extends SetPasswordTest {

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions = {
				noJsonInResponse: true,
				expectRedirect: true
			};
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/user/password/reset/invalid', 'incorrect redirect');
	}
}

module.exports = ErrorTest;
