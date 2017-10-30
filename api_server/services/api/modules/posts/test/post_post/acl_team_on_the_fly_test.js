'use strict';

var ACL_Test = require('./acl_test');

class ACL_Team_On_The_Fly_Test extends ACL_Test {

	constructor (options) {
		super(options);
		this.without_me_on_team = true;
		this.on_the_fly = true;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1011',
			reason: 'user not on team'
		};
	}

	get description () {
		return `should return an error when trying to create a post in an on-the-fly stream for a team that i\'m not a member of`;
	}
}

module.exports = ACL_Team_On_The_Fly_Test;
