'use strict';

var ACLTest = require('./acl_test');

class ACLRepoOnTheFlyTest extends ACLTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;
		this.onTheFly = true;
		this.type = 'file';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for repo'
		};
	}

	get description () {
		return `should return an error when trying to create a post in an on-the-fly file stream for a repo from a team that i\'m not a member of`;
	}
}

module.exports = ACLRepoOnTheFlyTest;
