'use strict';

var Already_On_Team_Test = require('./already_on_team_test');

class Not_On_Team_Test extends Already_On_Team_Test {

	constructor (options) {
		super(options);
		this.test_options.dont_include_current_user = true;
	}

	get_description () {
		return 'should return an error when trying to add a repo to an existing team that the user is not a member of';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1010',
		};
	}
}

module.exports = Not_On_Team_Test;
