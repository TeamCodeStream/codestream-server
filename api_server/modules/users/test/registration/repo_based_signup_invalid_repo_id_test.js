'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');
const ObjectId = require('mongodb').ObjectId;

class RepoBasedSignupInvalidRepoIdTest extends RepoBasedSignupTest {

	get description() {
		return 'should return error when registering using repo-based signup with a repo ID for a repo that does not exist';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// before the test runs...
	before(callback) {
		// delete the attribute in question
		super.before(error => {
			if (error) { return callback(error); }
			this.data.repoId = ObjectId();
			callback();
		});
	}
}

module.exports = RepoBasedSignupInvalidRepoIdTest;
