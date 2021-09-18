'use strict';

const MatchRepoTest = require('./match_repo_test');

class CreateRepoTest extends MatchRepoTest {

	get description () {
		return 'should NOT return a new repo, when trying to matching a remote that is not a known repo for the team, in read-only mode';
	}

	getRequestData () {
		const data = super.getRequestData();
		this.unknownRemote = this.repoFactory.randomUrl();
		data.repos[0].remotes = [this.unknownRemote];
		this.expectedRepos = [];
		return data;
	}
}

module.exports = CreateRepoTest;
