'use strict';

var Get_Users_Test = require('./get_users_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Get_Users_Only_From_Team_Test extends Get_Users_Test {

	get description () {
		return 'should return only the users for the team i\'m a member of';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_foreign_repo,
			this.set_path
		], callback);
	}

	create_foreign_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreign_users = response.users;
				callback();
			},
			{
				with_random_emails: 3,
				token: this.other_user_data.access_token
			}
		);
	}

	set_path (callback) {
		if (!this.foreign_users) { return callback(); }
		let team_id = this.team._id;
		this.my_users = [
			this.users[1],
			this.users[3],
			this.users[4]
		];
		let foreign_users = [
			this.foreign_users[0],
			this.foreign_users[2]
		];
		let all_users = [...this.my_users, ...foreign_users];
		let ids = all_users.map(user => user._id);
		this.path = `/users?team_id=${team_id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Users_Only_From_Team_Test;
