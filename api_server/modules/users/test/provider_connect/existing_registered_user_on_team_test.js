'use strict';

const ExistingUnregisterdUserOnTeamTest = require('./existing_unregistered_user_on_team_test');

class ExistingRegisterdUserOnTeamTest extends ExistingUnregisterdUserOnTeamTest {

	constructor (options) {
		super(options);
		this.preExistingUserIsRegistered = true;
	}

	get description () {
		return `should return a pre-existing registered user who is already on a team, but we should create a team rather than connecting the existing team to the ${this.provider} team`;
	}
}

module.exports = ExistingRegisterdUserOnTeamTest;
