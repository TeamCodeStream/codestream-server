'use strict';

const MatchRepoTest = require('./match_repo_test');

class NoRemotesTest extends MatchRepoTest {

	get description () {
		return 'should return an empty array when attempting to match a repo with no remotes';
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			this.data.repos[0].remotes = [];
			this.expectedRepos = [];
			callback();
		});
	}
}

module.exports = NoRemotesTest;
