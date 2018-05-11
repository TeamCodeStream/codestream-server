'use strict';

const ChangePasswordTest = require('./change_password_test');
const RandomString = require('randomstring');

class BadPasswordTest extends ChangePasswordTest {

	constructor (options) {
		super(options);
		this.dontLoginToVerify = true;
	}

	get description () {
		return 'should return an error when changing password to a zero-length password';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'password must be at least six characters'
		};
	}

	// set the data to use when changing password
	setData (callback) {
		// set the data, but make the new password zero-length
		super.setData(() => {
			this.passwordData.newPassword = RandomString.generate(5);
			callback();
		});
	}
}

module.exports = BadPasswordTest;
