'use strict';

var AddUsersTest = require('./add_users_test');

class AddUsersUniqueUsernamesTest extends AddUsersTest {

	constructor (options) {
		super(options);
		this.testOptions.wantConflictingUserWithExistingUser = true;
	}

	get description () {
		return 'should return an error when creating a repo with emails where there is a username conflict with an existing email';
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

module.exports = AddUsersUniqueUsernamesTest;
