'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');
const ObjectID = require('mongodb').ObjectID;

class RepoBasedSignupTeamNotFoundTest extends RepoBasedSignupTest {

	get description() {
		return 'should return error when registering using repo-based signup with a team ID for a team that does not exist';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	// before the test runs...
	before(callback) {
		// delete the attribute in question
		super.before(error => {
			if (error) { return callback(error); }
			this.data.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = RepoBasedSignupTeamNotFoundTest;
