'use strict';

const RepoBasedSignupTest = require('./repo_based_signup_test');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class RepoBasedSignupMismatchedRepoTest extends RepoBasedSignupTest {

	get description() {
		return `should return error when registering using repo-based signup with a repo ID for a repo not owned by the team`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1011',
			reason: 'given repo is not owned by the given team'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// create a second team with a second repo, and use that repo for the test
			new TestTeamCreator({
				test: this,
				userOptions: this.userOptions,
				teamOptions: this.teamOptions,
				repoOptions: this.repoOptions
			}).create((error, response) => {
				if (error) { return callback(error); }
				this.data.repoId = response.repos[0].id;
				callback();
			});

		})
	}
}

module.exports = RepoBasedSignupMismatchedRepoTest;
