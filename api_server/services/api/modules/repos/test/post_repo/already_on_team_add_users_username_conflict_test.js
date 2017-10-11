'use strict';

var Already_On_Team_Add_Users_Test = require('./already_on_team_add_users_test');

class Already_On_Team_Add_Users_Username_Conflict_Test extends Already_On_Team_Add_Users_Test {

	constructor (options) {
		super(options);
		this.test_options.want_conflicting_user_with_current_user = true;
	}

	get description () {
		return 'should return an error when a user who is already on a team tries to create a repo with emails when there is a username conflict with the current user';
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

module.exports = Already_On_Team_Add_Users_Username_Conflict_Test;
