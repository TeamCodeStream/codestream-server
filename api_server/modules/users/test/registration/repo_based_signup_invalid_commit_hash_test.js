'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');

class RepoBasedSignupInvalidCommitHashTest extends RepoBasedSignupTest {

	get description() {
		return 'should return error when registering using repo-based signup with a commit hash that does not match the known commit hashes for the repo';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1011',
			reason: 'commit hash is incorrect for this repo'
		};
	}

	// before the test runs...
	before(callback) {
		// delete the attribute in question
		super.before(error => {
			if (error) { return callback(error); }
			this.data.commitHash = this.markerFactory.randomCommitHash();
			callback();
		});
	}
}

module.exports = RepoBasedSignupInvalidCommitHashTest;
