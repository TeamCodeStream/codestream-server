'use strict';

const GetRepoTest = require('./get_repo_test');

class ACLTest extends GetRepoTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a repo for a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;
