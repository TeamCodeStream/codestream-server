'use strict';

const GetForeignUsersTest = require('./get_foreign_users_test');

class GetForeignUsersByIdTest extends GetForeignUsersTest {

	get description () {
		return 'should return the right users when requesting users by IDs, including "foreign" users';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.setPath(callback);
		});
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		if (!this.myUsers) { return super.setPath(callback); }

		// restrict the users we fetch to a subset of the users on the team
		const teamId = this.team.id;
		this.myUsers = [1,3,7].map(index => this.myUsers[index]);
		const ids = this.myUsers.map(user => user.id);
		this.path = `/users?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetForeignUsersByIdTest;
