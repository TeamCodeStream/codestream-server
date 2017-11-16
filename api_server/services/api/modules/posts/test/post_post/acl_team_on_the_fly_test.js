'use strict';

var ACLTest = require('./acl_test');

class ACLTeamOnTheFlyTest extends ACLTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;
		this.onTheFly = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'user not on team'
		};
	}

	get description () {
		return `should return an error when trying to create a post in an on-the-fly stream for a team that i\'m not a member of`;
	}
}

module.exports = ACLTeamOnTheFlyTest;
