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

	makePath (callback) {
		this.queryData.firstCommitHash = this.repoFactory.randomCommitHash();
		super.makePath(callback);
	}
}

module.exports = ShaMismatchTest;
