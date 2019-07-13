'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class NoPasswordTest extends SetPasswordTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions.expectRedirect = false;
	}

	get description () {
		return 'should render with an error message if trying to set a password without providing a password';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.password;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.indexOf('password is required') !== -1, 'error message was not rendered');
	}
}

module.exports = NoPasswordTest;
