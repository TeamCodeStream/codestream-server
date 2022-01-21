// tests for "POST /no-auth/generate-login-code"
'use strict';

const GenerateLoginCodeTest = require('./generate_login_code_test');
const GenerateLoginCodeMissingEmailTest = require('./generate_login_code_missing_email_test');
const GenerateLoginCodeBadEmailTest = require('./generate_login_code_bad_email_test');
const LoginCodeEmailTest = require('./login_code_email_test');

class GenerateLoginCodeTester {

	test () {
		new GenerateLoginCodeTest().test();
		new GenerateLoginCodeMissingEmailTest().test();
		new GenerateLoginCodeBadEmailTest().test();
		new LoginCodeEmailTest().test();
	}
}

module.exports = new GenerateLoginCodeTester();
