'use strict';

var ACLTest = require('./acl_test');

class ACLTeamTest extends ACLTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for stream'
		};
	}

	get description () {
		return `should return an error when trying to create a post in a stream for a team that i\'m not a member of`;
	}
}

module.exports = ACLTeamTest;
