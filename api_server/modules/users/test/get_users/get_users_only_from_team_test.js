'use strict';

var GetUsersTest = require('./get_users_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetUsersOnlyFromTeamTest extends GetUsersTest {

	get description () {
		return 'should return only the users for the team i\'m a member of';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignRepo,
			this.setPath
		], callback);
	}

	createForeignRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignUsers = response.users;
				this.foreignUsers = response.users.filter(user => user._id !== this.otherUserData.user._id);
				callback();
			},
			{
				withRandomEmails: 3,
				token: this.otherUserData.accessToken
			}
		);
	}

	setPath (callback) {
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
