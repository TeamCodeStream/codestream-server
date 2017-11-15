'use strict';

var RepoExistsNotOnTeamAddUsersTest = require('./repo_exists_not_on_team_add_users_test');

class RepoExistsNotOnTeamAddUsersUsernameConflictTest extends RepoExistsNotOnTeamAddUsersTest {

	constructor (options) {
		super(options);
		this.testOptions.wantConflictingUserWithCurrentUser = true;
	}

	get description () {
		return 'should return an error when a user tries to add a repo that already exists and the user is not on the team, and the user adds other users, and there is a username conflict with the current user';
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

module.exports = RepoExistsNotOnTeamAddUsersUsernameConflictTest;
