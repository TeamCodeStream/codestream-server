'use strict';

const AddUsersTest = require('./add_users_test');

class UsersNotOnTeamTest extends AddUsersTest {

	get description () {
		return 'should return an error when trying to add users to a stream when one or more of the users aren\'t on the team that owns the stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
    
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [0, 1];
			callback();
		});
	}
}

module.exports = UsersNotOnTeamTest;
