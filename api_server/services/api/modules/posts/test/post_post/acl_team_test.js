'use strict';

var ACL_Test = require('./acl_test');

class ACL_Team_Test extends ACL_Test {

	constructor (options) {
		super(options);
		this.without_me_on_team = true;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for stream'
		};
	}

	get description () {
		return `should return an error when trying to create a post in a stream for a team that i\'m not a member of`;
	}
}

module.exports = ACL_Team_Test;
