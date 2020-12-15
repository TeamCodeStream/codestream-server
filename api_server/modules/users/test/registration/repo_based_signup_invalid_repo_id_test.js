'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.data.repoId = ObjectID();
			callback();
		});
	}
}

module.exports = RepoBasedSignupInvalidRepoIdTest;
