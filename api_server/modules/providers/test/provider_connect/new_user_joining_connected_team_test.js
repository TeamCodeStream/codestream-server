'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const Assert = require('assert');

class NewUserJoiningConnectedTeamTest extends ProviderConnectTest {

	constructor (options) {
		super(options);
		this.wantPreExistingTeam = true;
	}

	get description () {
		return `should create a new user and link them to the team when a user connects to a ${this.provider} team that is already associated with a team on CodeStream`;
	}

	// validate the response to the test request
	validateResponse (data) {
		const { user } = data;
		const team = data.teams[0];

		// ensure created user is on the same team as the original user
		Assert.equal(team.id, this.preExistingTeam.id, 'returned team does not match pre-created team');
		Assert.deepEqual(user.teamIds, this.preExistingTeamCreator.teamIds, 'teamIds of created user does not match that of the pre-existing team creator');
		Assert(team.memberIds.includes(user.id), 'returned user is not in the team returned');

		super.validateResponse(data);
	} 
}

module.exports = NewUserJoiningConnectedTeamTest;
