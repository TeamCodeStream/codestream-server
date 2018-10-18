'use strict';

const ChangePasswordTest = require('./change_password_test');

class RequiredParameterTest extends ChangePasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return `should return an error when changing password without ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// set the data to use when changing password
	setData (callback) {
		// set the data, but then delete the parameter in question
		super.setData(() => {
			delete this.passwordData[this.parameter];
			callback();
		});
	}
}

module.exports = RequiredParameterTest;
