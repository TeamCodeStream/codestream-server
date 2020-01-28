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
		super.before(error => {
			if (error) { return callback(error); }
			this.token += 'x';	// bad token ... bad, bad token
			callback();
		});
	}
}

module.exports = AuthenticationInvalidTokenTest;
