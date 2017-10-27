'use strict';

var Get_Users_Test = require('./get_users_test');

class Get_Users_By_Id_Test extends Get_Users_Test {

	get description () {
		return 'should return the right users when requesting users by IDs';
	}

	set_path (callback) {
		let team_id = this.team._id;
		this.my_users = [
			this.users[1],
			this.users[3],
			this.users[4]
		];
		let ids = this.my_users.map(user => user._id);
		this.path = `/users?team_id=${team_id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Users_By_Id_Test;
