'use strict';

var RepoExistsAddUsersTest = require('./repo_exists_add_users_test');

class RepoExistsAddUsersUniqueUsernamesTest extends RepoExistsAddUsersTest {

	constructor (options) {
		super(options);
		this.testOptions.wantConflictingUserWithExistingUser = true;
	}

	get description () {
		return 'should return an error when a user tries to add a repo that already exists and there is a username conflict with an existing email';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = RepoExistsAddUsersUniqueUsernamesTest;
