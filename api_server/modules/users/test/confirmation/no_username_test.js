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

	// before the test runs...
	before (callback) {
		// indicate to suppress the username when we do the initial register call ... so
		// when they try to confirm (and still don't set a username), the call fails
		this.userOptions = {
			noUsername: true
		};
		super.before(callback);
	}
}

module.exports = NoUsernameTest;
