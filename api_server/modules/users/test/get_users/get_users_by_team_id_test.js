'use strict';

const GetUsersTest = require('./get_users_test');

class GetUsersByTeamIdTest extends GetUsersTest {

	get description () {
		return 'should return all users in the team when requesting users by team ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// fetch all users on the team by specifying the team ID
		const teamId = this.team.id;
		this.myUsers = this.users.map(user => user.user);
		this.path = `/users?teamId=${teamId}`;
		callback();
	}
}

module.exports = GetUsersByTeamIdTest;
