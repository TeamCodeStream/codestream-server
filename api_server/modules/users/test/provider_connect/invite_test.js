'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class InviteTest extends ProviderConnectTest {

	constructor (options) {
		super(options);
		this.wantPreExistingTeam = true;
	}

	get description () {
		return `should connect to the pre-existing user when a user connects to ${this.provider} and they have been invited`;
	}

	// before the test runs...
	before (callback) {
		// add the team ID to the request
		super.before(() => {
			this.data.teamId = this.preExistingTeam._id;
			callback();
		});
	}
}

module.exports = InviteTest;
