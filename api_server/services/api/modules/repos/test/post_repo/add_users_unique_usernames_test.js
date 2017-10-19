'use strict';

var Add_Users_Test = require('./add_users_test');

class Add_Users_Unique_Usernames_Test extends Add_Users_Test {

	constructor (options) {
		super(options);
		this.test_options.want_conflicting_user_with_existing_user = true;
	}

	get description () {
		return 'should return an error when creating a repo with emails where there is a username conflict with an existing email';
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

module.exports = Add_Users_Unique_Usernames_Test;
