'use strict';

const MatchRepoTest = require('./match_repo_test');

class AddCommitHashTest extends MatchRepoTest {

	get description () {
		return 'when matching a known repo and providing an additional known commit hash, in read-only mode, the commit hash should NOT be added to the repo';
	}

	getRequestData () {
		const data = super.getRequestData();
		const addedCommitHash = this.markerFactory.randomCommitHash();
		data.repos[0].knownCommitHashes = [addedCommitHash];
		return data;
	}
}

module.exports = AddCommitHashTest;
