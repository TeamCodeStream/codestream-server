'use strict';

var PostRepoTest = require('./post_repo_test');

class ShaMismatchTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.testOptions.wantOtherRepo = true;	// create a repo before the test runs
	}

	get description () {
		return 'should return an error when trying to create a repo that already exists and the first commit SHA doesn\'t match';
	}

	getExpectedError () {
		return {
			code: 'REPO-1000',
		};
	}

	// make the data to be used when making the POST /repos request
	makeRepoData (callback) {
		// use the url for the repo that we already created, but with an incorrect commit hash
		this.data = {
			url: this.existingRepo.url,
			firstCommitHash: this.repoFactory.randomCommitHash()
		};
		callback();
	}
}

module.exports = ShaMismatchTest;
