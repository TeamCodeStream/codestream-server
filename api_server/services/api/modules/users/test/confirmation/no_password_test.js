'use strict';

var ConfirmationTest = require('./confirmation_test');

class NoPasswordTest extends ConfirmationTest {

	get description () {
		return 'should return an error when no password passed in confirmation and user has no password yet';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'password'
		};
	}

	before (callback) {
		this.userOptions = {
			noPassword: true
		};
		super.before(callback);
	}
}

module.exports = NoPasswordTest;
