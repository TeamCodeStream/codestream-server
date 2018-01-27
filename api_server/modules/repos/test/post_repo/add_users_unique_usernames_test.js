'use strict';

var AddUsersTest = require('./add_users_test');

class AddUsersUniqueUsernamesTest extends AddUsersTest {

	constructor (options) {
		super(options);
		// adding users to the team on-the-fly, try to add one with a username that conflicts with an already existing user
		this.testOptions.wantConflictingUserWithExistingUser = true;
	}

	get description () {
		return 'should return an error when creating a repo with emails where there is a username conflict with an existing email';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = AddUsersUniqueUsernamesTest;
