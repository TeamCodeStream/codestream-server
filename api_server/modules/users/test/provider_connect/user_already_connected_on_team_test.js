'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const Assert = require('assert');

class UserAlreadyConnectedOnTeamTest extends ProviderConnectTest {

	constructor (options) {
		super(options);
		this.wantPreExistingTeam = true;
		this.wantPreExistingConnectedUser = true;
	}

	get description () {
		return `should connect to the pre-existing user when a user connects to ${this.provider} and they are already connected`;
	}

	// validate the response to the test request
	validateResponse (data) {
		const { user } = data;
		const team = data.teams[0];

		// ensure returned user is the same as the pre-existing user
		Assert.equal(user._id, this.preExistingConnectedUser._id, 'returned user is not the same as the pre-existing user');
		Assert.equal(team._id, this.preExistingTeam._id, 'returned team does not match pre-created team');
		Assert.deepEqual(user.teamIds, this.preExistingTeamCreator.teamIds, 'teamIds of created user does not match that of the pre-existing team creator');
		Assert(team.memberIds.includes(user._id), 'returned user is not in the team returned');

		super.validateResponse(data);
	} 
}

module.exports = UserAlreadyConnectedOnTeamTest;
