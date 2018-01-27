'use strict';

var RepoExistsNotOnTeamAddUsersTest = require('./repo_exists_not_on_team_add_users_test');

class RepoExistsNotOnTeamAddUsersUsernameConflictTest extends RepoExistsNotOnTeamAddUsersTest {

	constructor (options) {
		super(options);
		// adding users to the team on-the-fly, try to add one with a username that conflicts with the current user
		this.testOptions.wantConflictingUserWithCurrentUser = true;
	}

	get description () {
		return 'should return an error when a user tries to add a repo that already exists and the user is not on the team, and the user adds other users, and there is a username conflict with the current user';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = RepoExistsNotOnTeamAddUsersUsernameConflictTest;
