'use strict';

var ExactMatchTest = require('./exact_match_test');

class MultipleCommitHashTest extends ExactMatchTest {

	constructor (options) {
		super(options);
		this.numKnownCommitHashes = 4;
	}

	get description () {
		return 'should exactly match the appropriate repo if the known commit hashes overlap with the existing repo';
	}

	// make the path we'll use to run the test request, with pre-established query parameters
	getQueryParameters () {
		const repo = this.repos[this.matches[0]];
		let queryParameters = super.getQueryParameters();
		queryParameters.knownCommitHashes = [
			this.repoFactory.randomCommitHash(),
			repo.knownCommitHashes[2].toUpperCase(),
			this.repoFactory.randomCommitHash()
		];
		return queryParameters;
	}
}

module.exports = MultipleCommitHashTest;
