'use strict';

var FindRepoTest = require('./find_repo_test');

class ShaMismatchTest extends FindRepoTest {

	get description () {
		return 'should return error when the repo exists but the hash of the first commit is incorrect';
	}

	getExpectedError () {
		return {
			code: 'REPO-1000'
		};
	}

	// make the path we'll use to run the test request, with pre-established query parameters
	makePath (callback) {
		// substitute a different commit hash in the request
		this.queryData.firstCommitHash = this.repoFactory.randomCommitHash();
		super.makePath(callback);
	}
}

module.exports = ShaMismatchTest;
