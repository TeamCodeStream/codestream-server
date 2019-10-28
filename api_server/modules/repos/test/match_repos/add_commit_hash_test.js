'use strict';

const MatchRepoTest = require('./match_repo_test');

class AddCommitHashTest extends MatchRepoTest {

	get description () {
		return 'when matching a known repo and providing an additional known commit hash, the commit hash should be added to the repo';
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			const addedCommitHash = this.markerFactory.randomCommitHash();
			this.data.repos[0].knownCommitHashes = [addedCommitHash];
			this.expectedRepos = [Object.assign({}, this.repo, {
				version: 2,
				modifiedAt: 0 // placeholder
			})];
			this.expectedRepos[0].knownCommitHashes.push(addedCommitHash.toLowerCase());
			callback();
		});
	}
}

module.exports = AddCommitHashTest;
