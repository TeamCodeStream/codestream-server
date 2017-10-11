'use strict';

var Add_Users_Test = require('./add_users_test');

class Add_Users_Username_Conflict_Test extends Add_Users_Test {

	constructor (options) {
		super(options);
		this.test_options.want_conflicting_user_with_current_user = true;
	}

	get_description () {
		return 'should return an error when creating a repo with emails where there is a username conflict with the current user';
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

module.exports = Add_Users_Username_Conflict_Test;
