'use strict';

const MatchRepoTest = require('./match_repo_test');

class MatchRepoByCommitHashTest extends MatchRepoTest {

	get description () {
		return 'should return the repo, when matching a known repo by commit hash (read-only)';
	}

	getRequestData () {
		const data = super.getRequestData();
		delete data.repos[0].remotes;
		data.repos[0].knownCommitHashes = [this.repo.knownCommitHashes[0]];
		return data;
	}
}

module.exports = MatchRepoByCommitHashTest;
