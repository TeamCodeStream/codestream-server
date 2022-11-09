// tests for "POST /no-auth/generate-login-code"
'use strict';

const GenerateLoginCodeTest = require('./generate_login_code_test');
const GenerateLoginCodeMissingEmailTest = require('./generate_login_code_missing_email_test');
const GenerateLoginCodeBadEmailTest = require('./generate_login_code_bad_email_test');
const LoginCodeEmailTest = require('./login_code_email_test');
const UnregisteredUserTest = require('./unregistered_user_test');
const NoLoginCodeToUnregisteredUserTest = require('./no_login_code_to_unregistered_user_test');

const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

class GenerateLoginCodeTester {

	test () {
		new GenerateLoginCodeTest().test();
		new GenerateLoginCodeTest({ oneUserPerOrg: true }).test();
		new GenerateLoginCodeMissingEmailTest().test();
		new GenerateLoginCodeBadEmailTest().test();
		new UnregisteredUserTest().test();
		SerializeTests([
			LoginCodeEmailTest,
			NoLoginCodeToUnregisteredUserTest
		]);
	}
}

module.exports = new GenerateLoginCodeTester();
