'use strict';

const AuthenticationTest = require('./authentication_test');

class AuthenticationInvalidTokenTest extends AuthenticationTest {

	get description () {
		return 'should prevent access to resources when access token is invalid';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	async before () {
		await super.before();
		this.token += 'x';	// bad token ... bad, bad token
	}
}

module.exports = AuthenticationInvalidTokenTest;
