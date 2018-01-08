'use strict';

var GetUsersTest = require('./get_users_test');

class GetUsersByTeamIdTest extends GetUsersTest {

	get description () {
		return 'should return all users in the team when requesting users by team ID';
	}

	setPath (callback) {
		let teamId = this.team._id;
		this.myUsers = this.users;
		this.path = `/users?teamId=${teamId}`;
		callback();
	}
}

module.exports = GetUsersByTeamIdTest;
