'use strict';

const PostRepoTest = require('./post_repo_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CreateSecondTeamTest extends PostRepoTest {

	get description () {
		return 'should return a valid repo and team when creating a repo, and team should indicate primary referral as internal, when user is already on a team';
	}

	before (callback) {
		this.teamReferral = 'internal';
		BoundAsync.series(this, [
			this.createInitialRepo,
			super.before
		], callback);
	}

	createInitialRepo (callback) {
		this.repoFactory.createRandomRepo(
			callback,
			{ token: this.token }
		);
	}
}

module.exports = CreateSecondTeamTest;
