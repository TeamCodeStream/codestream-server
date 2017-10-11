'use strict';

var Already_On_Team_Test = require('./already_on_team_test');

class Already_On_Team_Add_Users_Test extends Already_On_Team_Test {

	get_description () {
		return 'should return the new repo when trying to add a repo to an existing team that the user is already on, including adding new users';
	}

	make_repo_data (callback) {
		this.create_mixed_users(error => {
			if (error) { return callback(error); }
			this.other_repo_options = {};
			super.make_repo_data(callback);
		});
	}
}

module.exports = Already_On_Team_Add_Users_Test;
