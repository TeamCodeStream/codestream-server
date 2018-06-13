// handle unit tests for the "PUT /reset-password" request for a user to reset their password 

'use strict';

const ResetPasswordTest = require('./reset_password_test');
const RequiredParameterTest = require('./required_parameter_test');
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const NoEmailTest = require('./no_email_test');
const NotRstTokenTest = require('./not_rst_token_test');
const UserNotFoundTest = require('./user_not_found_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');
const BadPasswordTest = require('./bad_password_test');
const AccessTokenTest = require('./access_token_test');
const OldTokenInvalidTest = require('./old_token_invalid_test');

class ResetPasswordRequestTester {

	test () {
		new ResetPasswordTest().test();
		new RequiredParameterTest({ parameter: 'token' }).test();
		new RequiredParameterTest({ parameter: 'password' }).test();
		new InvalidTokenTest().test();
		new TokenExpiredTest().test();
		new NoEmailTest().test();
		new NotRstTokenTest().test();
		new UserNotFoundTest().test();
		new NoIssuanceTest().test();
		new TokenDeprecatedTest().test();
		new BadPasswordTest().test();
		new AccessTokenTest().test();
		new OldTokenInvalidTest().test();
	}
}

module.exports = new ResetPasswordRequestTester();
