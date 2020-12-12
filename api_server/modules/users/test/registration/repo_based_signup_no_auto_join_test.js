'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');

class RepoBasedSignupNoAutoJoinTest extends RepoBasedSignupTest {

	get description() {
		return `should return error when registering using repo-based signup with a repo ID for which auto-join is not enabled for the team that owns the repo`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1011',
			reason: 'auto-join is not turned on for this repo'
		};
	}

	// override default setTeamSettings to ignore setting the auto-join
	setTeamSettings (callback) {
		callback();
	}
}

module.exports = RepoBasedSignupNoAutoJoinTest;
