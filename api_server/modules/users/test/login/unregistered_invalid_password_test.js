'use strict';

const InvalidPasswordTest = require('./invalid_password_test');

class UnregisteredInvalidPasswordTest extends InvalidPasswordTest {

	constructor (options) {
		super(options);
		this.noConfirm = true;
	}

	get description () {
		return 'should return a password error and not an unregistered error when invalid password provided to login for unregistered user';
	}
}

module.exports = UnregisteredInvalidPasswordTest;
