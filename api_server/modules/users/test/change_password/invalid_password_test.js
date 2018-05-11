'use strict';

const ChangePasswordTest = require('./change_password_test');
const RandomString = require('randomstring');

class InvalidPasswordTest extends ChangePasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when changing password and specifying and invalid existing password';
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	// set the data to use when changing password
	setData (callback) {
		// set the data, but change the existing password
		super.setData(() => {
			this.passwordData.existingPassword = RandomString.generate(12);
			callback();
		});
	}
}

module.exports = InvalidPasswordTest;
