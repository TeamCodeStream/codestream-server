'use strict';

var AlreadyOnTeamAddUsersTest = require('./already_on_team_add_users_test');

class AlreadyOnTeamAddUsersUsernameConflictTest extends AlreadyOnTeamAddUsersTest {

	constructor (options) {
		super(options);
		this.testOptions.wantConflictingUserWithCurrentUser = true;
	}

	get description () {
		return 'should return an error when a user who is already on a team tries to create a repo with emails when there is a username conflict with the current user';
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

module.exports = AlreadyOnTeamAddUsersUsernameConflictTest;
