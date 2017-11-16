'use strict';

var GetUsersTest = require('./get_users_test');

class GetUsersByIdTest extends GetUsersTest {

	get description () {
		return 'should return the right users when requesting users by IDs';
	}

	setPath (callback) {
		let teamId = this.team._id;
		this.myUsers = [
			this.users[1],
			this.users[3],
			this.users[4]
		];
		let ids = this.myUsers.map(user => user._id);
		this.path = `/users?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetUsersByIdTest;
