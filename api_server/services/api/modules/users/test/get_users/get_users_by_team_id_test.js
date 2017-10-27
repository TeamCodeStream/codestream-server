'use strict';

var Get_Users_Test = require('./get_users_test');

class Get_Users_By_Team_Id_Test extends Get_Users_Test {

	get description () {
		return 'should return all users in the team when requesting users by team ID';
	}

	set_path (callback) {
		let team_id = this.team._id;
		this.my_users = [this.other_user_data.user, ...this.users];
		this.path = `/users?team_id=${team_id}`;
		callback();
	}
}

module.exports = Get_Users_By_Team_Id_Test;
