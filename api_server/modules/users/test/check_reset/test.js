// handle unit tests for the "PUT /check-reset" request to verify a token issued on a forgot-password request

'use strict';

const CheckResetTest = require('./check_reset_test');
const RequiredParameterTest = require('./required_parameter_test');
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const NoEmailTest = require('./no_email_test');
const NotRstTokenTest = require('./not_rst_token_test');
const UserNotFoundTest = require('./user_not_found_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');

class CheckResetRequestTester {

	test () {
		new CheckResetTest().test();
		new RequiredParameterTest({ parameter: 'token' }).test();
		new InvalidTokenTest().test();
		new TokenExpiredTest().test();
		new NoEmailTest().test();
		new NotRstTokenTest().test();
		new UserNotFoundTest().test();
		new NoIssuanceTest().test();
		new TokenDeprecatedTest().test();
	}
}

module.exports = new CheckResetRequestTester();
