'use strict';

const ResetPasswordTest = require('./reset_password_test');
const RandomString = require('randomstring');

class BadPasswordTest extends ResetPasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when resetting password and specifying an invalid password';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'password must be at least'
		};
	}

	// set the data to use when resetting password
	setData (callback) {
		// set the data, but change the existing password
		super.setData(() => {
			this.passwordData.password = RandomString.generate(5);
			callback();
		});
	}
}

module.exports = BadPasswordTest;
