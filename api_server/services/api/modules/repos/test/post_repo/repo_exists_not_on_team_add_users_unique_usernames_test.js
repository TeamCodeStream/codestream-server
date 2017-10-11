'use strict';

var Repo_Exists_Not_On_Team_Add_Users_Test = require('./repo_exists_not_on_team_add_users_test');

class Repo_Exists_Not_On_Team_Add_Users_Unique_Usernames_Test extends Repo_Exists_Not_On_Team_Add_Users_Test {

	constructor (options) {
		super(options);
		this.test_options.want_conflicting_user_with_existing_user = true;
	}

	get_description () {
		return 'should return an error when a user tries to add a repo that already exists and the user is not on the team, and the user adds other users, and there is a username conflict with an existing email';
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

module.exports = Repo_Exists_Not_On_Team_Add_Users_Unique_Usernames_Test;
