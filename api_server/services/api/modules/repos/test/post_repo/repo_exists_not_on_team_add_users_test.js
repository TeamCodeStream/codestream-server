'use strict';

var Repo_Exists_Add_Users_Test = require('./repo_exists_add_users_test');

class Repo_Exists_Not_On_Team_Add_Users_Test extends Repo_Exists_Add_Users_Test {

	constructor (options) {
		super(options);
		this.test_options.dont_include_current_user = true;
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the user is not on the team, and the user adds other users (the user and other users should be added to the team)';
	}

	validate_response (data) {
		this.team_emails.push(this.current_user.emails[0]);
		super.validate_response(data);
	}
}

module.exports = Repo_Exists_Not_On_Team_Add_Users_Test;
