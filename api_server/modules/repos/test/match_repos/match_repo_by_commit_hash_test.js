'use strict';

const MatchRepoTest = require('./match_repo_test');

class MatchRepoByCommitHashTest extends MatchRepoTest {

	get description () {
		return 'should return the repo, when matching a known repo by commit hash';
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			delete this.data.repos[0].remotes;
			this.data.repos[0].knownCommitHashes = [this.repo.knownCommitHashes[0]];
			callback();
		});
	}
}

module.exports = MatchRepoByCommitHashTest;
