'use strict';

var ACL_Test = require('./acl_test');

class ACL_Repo_On_The_Fly_Test extends ACL_Test {

	constructor (options) {
		super(options);
		this.without_me_on_team = true;
		this.on_the_fly = true;
		this.type = 'file';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for repo'
		};
	}

	get description () {
		return `should return an error when trying to create a post in an on-the-fly file stream for a repo from a team that i\'m not a member of`;
	}
}

module.exports = ACL_Repo_On_The_Fly_Test;
