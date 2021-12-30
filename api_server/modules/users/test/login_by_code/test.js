// tests for "POST /no-auth/generate-login-code" and "PUT /no-auth/login-by-code"
'use strict';

const LoginByCodeTest = require('./login_by_code_test');
const InvalidCodeTest = require('./invalid_code_test');
const TooManyAttemptsTest = require('./too_many_attempts_test');
const ExpiredCodeTest = require('./expired_code_test');
const GenerateLoginCodeTest = require('./generate_login_code_test');

class LoginByCodeTester {

	test () {
		new LoginByCodeTest().test();
		new InvalidCodeTest().test();
		new TooManyAttemptsTest().test();
		new ExpiredCodeTest().test();
		new GenerateLoginCodeTest().test();
	}
}

module.exports = new LoginByCodeTester();
