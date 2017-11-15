'use strict';

var PostRepoTest = require('./post_repo_test');

class ShaMismatchTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherRepo = true;
	}

	get description () {
		return 'should return an error when trying to create a repo that already exists and the first commit SHA doesn\'t match';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'REPO-1000',
		};
	}

	makeRepoData (callback) {
		this.data = {
			url: this.existingRepo.url,
			firstCommitHash: this.repoFactory.randomCommitHash()
		};
		callback();
	}
}

module.exports = ShaMismatchTest;
