'use strict';

var AlreadyHaveRepoTest = require('./already_have_repo_test');

class MultipleCommitHashTest extends AlreadyHaveRepoTest {

	constructor (options) {
		super(options);
		this.otherRepoOptions = { numKnownCommitHashes: 4 };
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the known commit hashes overlap with the existing repo';
	}

	// make the data to be used when making the POST /repos request
	makeRepoData (callback) {
		// we created the original repo with 3 commit hashes, if we have just one of
		// those when we try to create this repo (which just returns the other repo),
		// we should still be ok with the match
		super.makeRepoData(() => {
			this.data.knownCommitHashes = [
				this.repoFactory.randomCommitHash(),
				this.existingRepo.knownCommitHashes[2].toUpperCase(),
				this.repoFactory.randomCommitHash()
			];
			this.expectedKnownCommitHashes = this.existingRepo.knownCommitHashes;
			callback();
		});
	}
}

module.exports = MultipleCommitHashTest;
