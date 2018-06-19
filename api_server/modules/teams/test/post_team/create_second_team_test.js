'use strict';

const PostTeamTest = require('./post_team_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CreateSecondTeamTest extends PostTeamTest {

	get description () {
		return 'should return a valid team when creating a team, and team should indicate primary referral as internal, when user is already on a team';
	}

	before (callback) {
		this.teamReferral = 'internal';
		BoundAsync.series(this, [
			this.createInitialTeam,
			super.before
		], callback);
	}

	// create a team prior to team created by the test request
	createInitialTeam (callback) {
		this.teamFactory.createRandomTeam(
			callback,
			{ token: this.token }
		);
	}
}

module.exports = CreateSecondTeamTest;
