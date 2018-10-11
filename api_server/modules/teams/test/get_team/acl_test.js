'use strict';

const GetTeamTest = require('./get_team_test');

class ACLTest extends GetTeamTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;
