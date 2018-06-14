// handle unit tests for the "PUT /resend-confirm" request to resend a confirmation email to
// an unregistered user

'use strict';

const ResendConfirmTest = require('./resend_confirm_test');
const RequiredParameterTest = require('./required_parameter_test');
const UnknownEmailTest = require('./unknown_email_test');
const ValidTokenTest = require('./valid_token_test');
const OriginalTokenDeprecatedTest = require('./original_token_deprecated_test');
const ResendConfirmEmailTest = require('./resend_confirm_email_test');
const AlreadyRegisteredEmailTest = require('./already_registered_email_test');
const SerializeTests = require(process.env.CS_API_TOP + '/lib/test_base/serialize_tests');

class ResendConfirmRequestTester {

	test () {
		new ResendConfirmTest().test();
		new RequiredParameterTest({ parameter: 'email' }).test();
		new UnknownEmailTest().test();
		new ValidTokenTest().test();
		new OriginalTokenDeprecatedTest().test();
		// these tests must be serialized because for technical reasons the tests
		// are actually run in their "before" stage, and they will fail due to timeouts
		// if they are run in parallel
		SerializeTests([
			ResendConfirmEmailTest,
			AlreadyRegisteredEmailTest
		]);
	}
}

module.exports = new ResendConfirmRequestTester();
