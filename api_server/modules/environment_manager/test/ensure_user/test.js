// handle unit tests for the "POST /xenv/ensure-user" request to ensure a user exists
// across environments (internal use only)

'use strict';

const EnsureExistingUserTest = require('./ensure_existing_user_test');
const EmailRequiredTest = require('./email_required_test');
const UserRequiredTest = require('./user_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const ConfirmUnregisteredUserTest = require('./confirm_unregistered_user_test');
const CreateUserTest = require('./create_user_test');

class FetchUserRequestTester {

	test () {
		new EnsureExistingUserTest().test();
		new EmailRequiredTest().test();
		new UserRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new ConfirmUnregisteredUserTest().test();
		new CreateUserTest().test();
	}
}

module.exports = new FetchUserRequestTester();
