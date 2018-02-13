'use strict';

var GetUsersTest = require('./get_users_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetUsersOnlyFromTeamTest extends GetUsersTest {

	get description () {
		return 'should return only the users for the team i\'m a member of';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// run standard setup for test of fetching users
			this.createForeignRepo,	// create another repo (and team) where the current user will not be a member of the team
			this.setPath			// set the path to use when issuing the test request
		], callback);
	}

	// create a "foreign" repo, where the team that owns the repo does not have the current user as a member
	createForeignRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignUsers = response.users;
				this.foreignUsers = response.users.filter(user => user._id !== this.otherUserData.user._id);
				callback();
			},
			{
				withRandomEmails: 3,	// add a few additional users for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll attempt to fetch some users from "our" team, and users from the "foreign" team, by ID
		// but since we're not allowed to see users on the foreign team, we should only see users on our team
		if (!this.foreignUsers) { return callback(); }
		let teamId = this.team._id;
		this.myUsers = [
			this.users[1],
			this.users[3],
			this.users[4]
		];
		let foreignUsers = [
			this.foreignUsers[0],
			this.foreignUsers[2]
		];
		let allUsers = [...this.myUsers, ...foreignUsers];
		let ids = allUsers.map(user => user._id);
		this.path = `/users?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetUsersOnlyFromTeamTest;
