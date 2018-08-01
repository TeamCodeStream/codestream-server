'use strict';

const AddUsersTest = require('./add_users_test');

class UsersNotOnTeamTest extends AddUsersTest {

	constructor (options) {
		super(options);
		this.addedUserNotOnTeam = true;
	}

	get description () {
		return 'should return an error when trying to add users to a stream when one or more of the users aren\'t on the team that owns the stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
    
	// get the users we want to add to the stream
	getAddedUsers () {
		const addedUsers = super.getAddedUsers();
		addedUsers.push(this.addedUserData.user);
		return addedUsers;
	}
}

module.exports = UsersNotOnTeamTest;
