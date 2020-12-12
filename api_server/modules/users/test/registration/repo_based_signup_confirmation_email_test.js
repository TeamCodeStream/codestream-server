// serves as the base class for other email notification tests

'use strict';

const ConfirmationEmailTest = require('./confirmation_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class RepoBasedSignupConfirmationEmailTest extends ConfirmationEmailTest {

	constructor(options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
		this.repoOptions.creatorIndex = 0;
	}

	get description() {
		return 'should send a confirmation email when a new user registers using repo-based signup';
	}

	// before the test runs...
	before(callback) {
		BoundAsync.series(this, [
			super.before,
			this.setTeamSettings,
			this.setRepoSignupData
		], callback);
	}

	// set the team settings to enable the auto-join feature
	setTeamSettings(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.team.id}`,
				token: this.users[0].accessToken,
				data: {
					autoJoinRepos: [this.repo.id]
				}
			},
			callback
		);
	}

	// set the data to pass with the request indicating repo-based signup
	setRepoSignupData(callback) {
		this.data.teamId = this.team.id;
		this.data.repoId = this.repo.id;
		this.data.commitHash = this.repo.knownCommitHashes[0];
		callback();
	}
}

module.exports = RepoBasedSignupConfirmationEmailTest;
