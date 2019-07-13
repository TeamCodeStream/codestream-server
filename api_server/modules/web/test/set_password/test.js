// unit tests associated with forgetting/setting/resetting password within the web module

'use strict';

const SetPasswordTest = require('./set_password_test');
const NoTokenTest = require('./no_token_test');
const TokenExpiredTest = require('./token_expired_test');
const InvalidTokenTest = require('./invalid_token_test');
const NotRstTokenTest = require('./not_rst_token_test');
const EmailMissingTest = require('./email_missing_test');
const UserNotFoundTest = require('./user_not_found_test');
const UserDeactivatedTest = require('./user_deactivated_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');
const NoPasswordTest = require('./no_password_test');
const LoginTest = require('./login_test');
const OldPasswordFailsTest = require('./old_password_fails_test');
const InvalidPasswordTest = require('./invalid_password_test');
const OldTokenInvalidTest = require('./old_token_invalid_test');

class SetPasswordRequestTester {

	test () {
		new SetPasswordTest().test();
		new NoTokenTest().test();
		new TokenExpiredTest().test();
		new InvalidTokenTest().test();
		new NotRstTokenTest().test();
		new EmailMissingTest().test();
		new UserNotFoundTest().test();
		new UserDeactivatedTest().test();
		new NoIssuanceTest().test();
		new TokenDeprecatedTest().test();
		new NoPasswordTest().test();
		new LoginTest().test();
		new OldPasswordFailsTest().test();
		new InvalidPasswordTest().test();
		new OldTokenInvalidTest().test();
	}
}

module.exports = new SetPasswordRequestTester();