// handle unit tests for the "POST /xenv/ensure-user" request to ensure a user exists
// across environments (internal use only)

'use strict';

const EnsureUserTest = require('./ensure_user_test');
const ConfirmUnregisteredUserTest = require('./confirm_unregistered_user_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const ExistingUnregisteredUserOnTeamTest = require('./existing_unregistered_user_on_team_test');
const ExistingRegisteredUserOnTeamTest = require('./existing_registered_user_on_team_test');
const EmailRequiredTest = require('./email_required_test');
const UserRequiredTest = require('./user_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');

class EnsureUserRequestTester {

	test () {
		new EnsureUserTest().test();
		new ConfirmUnregisteredUserTest().test();
		new ExistingRegisteredUserTest().test();
		new ExistingUnregisteredUserOnTeamTest().test();
		new ExistingRegisteredUserOnTeamTest().test();
		new EmailRequiredTest().test();
		new UserRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
	}
}

module.exports = new EnsureUserRequestTester();
