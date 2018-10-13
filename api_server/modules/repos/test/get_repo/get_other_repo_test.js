'use strict';

const GetRepoTest = require('./get_repo_test');

class GetOtherRepoTest extends GetRepoTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return a valid repo when requesting a repo created by another user on a team that i am on';
	}
}

module.exports = GetOtherRepoTest;
