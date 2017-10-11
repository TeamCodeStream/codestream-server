'use strict';

var Repo_Exists_Test = require('./repo_exists_test');

class Repo_Exists_Add_Users_Test extends Repo_Exists_Test {

	get_description () {
		return 'should return the repo when trying to add a repo that already exists and the user is on the team, including adding new users';
	}

	make_repo_data (callback) {
		this.create_mixed_users(error => {
			if (error) { return callback(error); }
			this.other_repo_options = {};
			super.make_repo_data(callback);
		});
	}
}

module.exports = Repo_Exists_Add_Users_Test;
