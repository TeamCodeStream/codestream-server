// handle unit tests for the "PUT /xenv/change-email" request to change a user's email
// across environments

'use strict';

const ChangeEmailTest = require('./change_email_test');
const FetchTest = require('./fetch_test');
const NotFoundTest = require('./not_found_test');
const EmailRequiredTest = require('./email_required_test');
const ToEmailRequiredTest = require('./to_email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const UserAlreadyExistsTest = require('./user_already_exists_test');
const MessageToTeamTest = require('./message_to_team_test');

class ChangeEmailRequestTester {

	test () {
		new ChangeEmailTest().test();
		new FetchTest().test();
		new NotFoundTest().test();
		new EmailRequiredTest().test();
		new ToEmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new UserAlreadyExistsTest().test();
		new MessageToTeamTest().test();
	}
}

module.exports = new ChangeEmailRequestTester();
