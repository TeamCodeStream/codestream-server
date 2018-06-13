'use strict';

const ResetPasswordTest = require('./reset_password_test');

class RequiredParameterTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return `should return an error when sending a reset password request without providing the ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// set the data to use when resetting password
	setData (callback) {
		// delete the parameter in question
		super.setData(() => {
			delete this.passwordData[this.parameter];
			callback();
		});
	}
}

module.exports = RequiredParameterTest;
