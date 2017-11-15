'use strict';

var ConfirmationTest = require('./confirmation_test');

class NoUsernameTest extends ConfirmationTest {

	get description () {
		return 'should return an error when no username passed in confirmation and user has no username yet';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'username'
		};
	}

	before (callback) {
		this.userOptions = {
			noUsername: true
		};
		super.before(callback);
	}
}

module.exports = NoUsernameTest;
