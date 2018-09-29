'use strict';

const ExistingUnregisterdUserTest = require('./existing_unregistered_user_test');
const Assert = require('assert');

class ExistingUnregisterdUserOnTeamTest extends ExistingUnregisterdUserTest {

	constructor (options) {
		super(options);
		this.wantPreExistingUnconnectedTeam = true;
	}

	get description () {
		return `should confirm a pre-existing unregistered user who is already on a team, but we should create a team rather than connecting the existing team to the ${this.provider} team`;
	}

	// validate the response to the test request
	validateResponse (data) {
		const team = data.teams[0];

		// ensure returned team is NOT the same as the pre-created team the user was already on
		Assert.notEqual(team._id, this.preExistingUnconnectedTeam._id, 'returned team matches pre-existing team');
		super.validateResponse(data);
	} 
}

module.exports = ExistingUnregisterdUserOnTeamTest;
