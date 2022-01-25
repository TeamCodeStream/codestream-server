// handle unit tests for the "POST /xenv/confirm-user" request to confirm a user
// across environments

'use strict';

const ConfirmUserTest = require('./confirm_user_test');
const NotFoundTest = require('./not_found_test');
const EmailRequiredTest = require('./email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const UsernameTest = require('./username_test');
const PasswordTest = require('./password_test');

class ConfirmUserRequestTester {

	test () {
		new ConfirmUserTest().test();
		new NotFoundTest().test();
		new EmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new UsernameTest().test();
		new PasswordTest().test();
	}
}

module.exports = new ConfirmUserRequestTester();
