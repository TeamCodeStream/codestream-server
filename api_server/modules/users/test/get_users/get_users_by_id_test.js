'use strict';

const GetUsersTest = require('./get_users_test');

class GetUsersByIdTest extends GetUsersTest {

	get description () {
		return 'should return the right users when requesting users by IDs';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// restrict the users we fetch to a subset of the users on the team
		const teamId = this.team.id;
		this.myUsers = [1,3,4].map(index => this.users[index].user);
		const ids = this.myUsers.map(user => user.id);
		this.path = `/users?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetUsersByIdTest;
