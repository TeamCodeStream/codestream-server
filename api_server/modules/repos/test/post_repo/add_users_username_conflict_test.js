'use strict';

var AddUsersTest = require('./add_users_test');

class AddUsersUsernameConflictTest extends AddUsersTest {

	constructor (options) {
		super(options);
		// adding users to the team on-the-fly, try to add one with a username that conflicts with the current user
		this.testOptions.wantConflictingUserWithCurrentUser = true;
	}

	get description () {
		return 'should return an error when creating a repo with emails where there is a username conflict with the current user';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = AddUsersUsernameConflictTest;
