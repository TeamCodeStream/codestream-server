'use strict';

var AlreadyOnTeamAddUsersTest = require('./already_on_team_add_users_test');

class AlreadyOnTeamAddUsersUniqueUsernamesTest extends AlreadyOnTeamAddUsersTest {

	constructor (options) {
		super(options);
		// adding users to the team on-the-fly, try to add one with a username that conflicts with an already existing user
		this.testOptions.wantConflictingUserWithExistingUser = true;
	}

	get description () {
		return 'should return an error when a user who is already on a team tries to create a repo with emails when there is a username conflict with an existing email';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = AlreadyOnTeamAddUsersUniqueUsernamesTest;
