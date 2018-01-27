'use strict';

var RepoExistsAddUsersTest = require('./repo_exists_add_users_test');

class RepoExistsAddUsersUniqueUsernamesTest extends RepoExistsAddUsersTest {

	constructor (options) {
		super(options);
		// adding users to the team on-the-fly, try to add one with a username that conflicts with an already existing user
		this.testOptions.wantConflictingUserWithExistingUser = true;
	}

	get description () {
		return 'should return an error when a user tries to add a repo that already exists and there is a username conflict with an existing email';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = RepoExistsAddUsersUniqueUsernamesTest;
