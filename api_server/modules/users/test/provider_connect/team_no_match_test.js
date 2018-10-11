'use strict';

const TeamMismatchTest = require('./team_mismatch_test');

class TeamNoMatchTest extends TeamMismatchTest {

	constructor (options) {
		super(options);
		this.wantPreExistingTeam = false;
	}

	get description () {
		return `should return error when connecting to ${this.provider} with a team ID but no matching team is found for the third-party team`;
	}
}

module.exports = TeamNoMatchTest;
