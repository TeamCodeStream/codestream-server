// handle unit tests for the "POST /web/user/password" request to set a password at the end of a reset password flow

'use strict';

const SetPasswordTest = require('./set_password_test');
const NoTokenTest = require('./no_token_test');
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const NoEmailTest = require('./no_email_test');
const NotRstTokenTest = require('./not_rst_token_test');
const UserNotFoundTest = require('./user_not_found_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');
const UnregisteredUserTest = require('./unregistered_user_test');
const LoginTest = require('./login_test');
const MultipleOrgTest = require('./multiple_org_test');

class WebSetPasswordRequestTester {

	test () {
		new SetPasswordTest().test();
		new NoTokenTest().test();
		new InvalidTokenTest().test();
		new TokenExpiredTest().test();
		new NoEmailTest().test();
		new NotRstTokenTest().test();
		new UserNotFoundTest().test();
		new NoIssuanceTest().test();
		new TokenDeprecatedTest().test();
		new UnregisteredUserTest().test();
		new LoginTest().test();
		new MultipleOrgTest().test();
	}
}

module.exports = new WebSetPasswordRequestTester();
