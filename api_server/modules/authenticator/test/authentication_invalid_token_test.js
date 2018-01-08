'use strict';

var AuthenticationTest = require('./authentication_test');

class AuthenticationInvalidTokenTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when access token is invalid';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	before (callback) {
		this.token += 'x';	// bad token ... bad, bad token
		super.before(callback);
	}
}

module.exports = AuthenticationInvalidTokenTest;
