'use strict';

const PostTeamTest = require('./post_team_test');

class CreateSecondTeamTest extends PostTeamTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 0;
		this.teamReferral = 'internal';
	}

	get description () {
		return 'should return a valid team when creating a team, and team should indicate primary referral as internal, when user is already on a team';
	}
}

module.exports = CreateSecondTeamTest;
