'use strict';

const GetTeamTest = require('./get_team_test');

class GetOtherTeamTest extends GetTeamTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return a valid team when requesting a team created by another user that i am on';
	}
}

module.exports = GetOtherTeamTest;
