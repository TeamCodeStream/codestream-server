// handle unit tests for the "DELETE /xenv/delete-user/:id" request to 
// delete a user from across environments

'use strict';

const DeleteUserTest = require('./delete_user_test');
const FetchTest = require('./fetch_test');
const NotFoundTest = require('./not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const UserOnTeamTest = require('./user_on_team_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');

class DeleteUserRequestTester {

	test () {
		new DeleteUserTest().test();
		new FetchTest().test();
		new NotFoundTest().test();
		new AlreadyDeletedTest().test();
		new UserOnTeamTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
	}
}

module.exports = new DeleteUserRequestTester();
