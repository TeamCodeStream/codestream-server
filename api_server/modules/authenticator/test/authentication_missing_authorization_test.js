'use strict';

var AuthenticationTest = require('./authentication_test');

class AuthenticationMissingAuthorizationTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when no access token is supplied';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	// before the test runs...
	before (callback) {
		delete this.token;
		super.before(callback);
	}
}

module.exports = AuthenticationMissingAuthorizationTest;
