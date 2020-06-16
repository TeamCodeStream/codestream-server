// handle unit tests for the "PUT /forgot-password" request for a user to get a reset password email 

'use strict';

const ForgotPasswordTest = require('./forgot_password_test');
const ResetPasswordEmailTest = require('./reset_password_email_test');
const RequiredParameterTest = require('./required_parameter_test');
const InvalidEmailTest = require('./invalid_email_test');
const UnknownEmailTest = require('./unknown_email_test');
const NoEmailToUnknownEmailTest = require('./no_email_to_unknown_email_test');
const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

class ForgotPasswordRequestTester {

	test () {
		new ForgotPasswordTest().test();
		new RequiredParameterTest({ parameter: 'email' }).test();
		new InvalidEmailTest().test();
		new UnknownEmailTest().test();
		// these tests must be serialized because for technical reasons the tests
		// are actually run in their "before" stage, and they will fail due to timeouts
		// if they are run in parallel
		SerializeTests([
			ResetPasswordEmailTest,
			NoEmailToUnknownEmailTest
		]);
	}
}

module.exports = new ForgotPasswordRequestTester();
