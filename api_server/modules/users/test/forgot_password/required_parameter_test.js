'use strict';

const ForgotPasswordTest = require('./forgot_password_test');

class RequiredParameterTest extends ForgotPasswordTest {

	get description () {
		return `should return an error when sending a reset password request without providing the ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// set the data to use when changing password
	before (callback) {
		// eliminate the parameter from the data sent with the request
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.email;
			callback();
		});
	}
}

module.exports = RequiredParameterTest;
