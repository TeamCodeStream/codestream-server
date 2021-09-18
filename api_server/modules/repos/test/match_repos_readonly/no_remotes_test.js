'use strict';

const MatchRepoTest = require('./match_repo_test');

class NoRemotesTest extends MatchRepoTest {

	get description () {
		return 'should return an empty array when attempting to match a repo in read-only mode with no remotes';
	}

	getRequestData () {
		const data = super.getRequestData();
		data.repos[0].remotes = [];
		this.expectedRepos = [];
		return data;
	}
}

module.exports = NoRemotesTest;
