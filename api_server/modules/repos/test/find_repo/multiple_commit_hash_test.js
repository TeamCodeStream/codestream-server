'use strict';

var FindRepoTest = require('./find_repo_test');

class MultipleCommitHashTest extends FindRepoTest {

	constructor (options) {
		super(options);
		this.numKnownCommitHashes = 4;
	}

	get description () {
		return 'should find the appropriate repo if the known commit hashes overlap with the existing repo';
	}

	// make the path we'll use to run the test request, with pre-established query parameters
	makePath (callback) {
		this.queryData.knownCommitHashes = [
			this.repoFactory.randomCommitHash(),
			this.repo.knownCommitHashes[2].toUpperCase(),
			this.repoFactory.randomCommitHash()
		];
		super.makePath(callback);
	}
}

module.exports = MultipleCommitHashTest;
