'use strict';

const CheckSignupTest = require('./check_signup_test');

class TokenExpiredTest extends CheckSignupTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000;
	}

	get description () {
		return 'should return an error when sending a check signup request with an expired signup token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}
}

module.exports = TokenExpiredTest;
