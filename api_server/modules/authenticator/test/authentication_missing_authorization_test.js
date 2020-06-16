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
		super.before(error => {
			if (error) { return callback(error); }
			delete this.token;
			callback();
		});
	}
}

module.exports = AuthenticationMissingAuthorizationTest;
