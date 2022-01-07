// tests for "POST /no-auth/generate-login-code" and "PUT /no-auth/login-by-code"
'use strict';

const LoginByCodeTest = require('./login_by_code_test');
const InvalidCodeTest = require('./invalid_code_test');
const TooManyAttemptsTest = require('./too_many_attempts_test');
const ExpiredCodeTest = require('./expired_code_test');
const MissingParametersTest = require('./missing_parameters_test');
const CodeUsableOnceTest = require('./code_usable_once_test');
const GenerateLoginCodeTest = require('./generate_login_code_test');
const GenerateLoginCodeMissingEmailTest = require('./generate_login_code_missing_email_test');
const GenerateLoginCodeBadEmailTest = require('./generate_login_code_bad_email_test');
const LoginCodeEmailTest = require('./login_code_email_test');

class LoginByCodeTester {

	test () {
		new LoginByCodeTest().test();
		new InvalidCodeTest().test();
		new TooManyAttemptsTest().test();
		new ExpiredCodeTest().test();
		new MissingParametersTest().test();
		new CodeUsableOnceTest().test();
		new GenerateLoginCodeTest().test();
		new GenerateLoginCodeMissingEmailTest().test();
		new GenerateLoginCodeBadEmailTest().test();
		new LoginCodeEmailTest().test();
	}
}

module.exports = new LoginByCodeTester();
