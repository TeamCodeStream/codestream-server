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
const PasswordHashTest = require('./password_hash_test');
const AlreadyRegisteredTest = require('./already_registered_test');
const MessageToTeamTest = require('./message_to_team_test');

class ConfirmUserRequestTester {

	test () {
		new ConfirmUserTest().test();
		new NotFoundTest().test();
		new EmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new UsernameTest().test();
		new PasswordTest().test();
		new PasswordHashTest().test();
		new AlreadyRegisteredTest().test();
		new MessageToTeamTest().test();
	}
}

module.exports = new ConfirmUserRequestTester();
