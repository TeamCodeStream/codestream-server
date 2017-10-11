'use strict';

var Repo_Exists_Add_Users_Test = require('./repo_exists_add_users_test');

class Repo_Exists_Add_Users_Username_Conflict_Test extends Repo_Exists_Add_Users_Test {

	constructor (options) {
		super(options);
		this.test_options.want_conflicting_user_with_current_user = true;
	}

	get description () {
		return 'should return an error when a user tries to add a repo that already exists and there is a username conflict with the current user';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'TEAM-1000'
		};
	}
}

module.exports = Repo_Exists_Add_Users_Username_Conflict_Test;
