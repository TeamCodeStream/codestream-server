'use strict';

const ExistsButUnregisteredTest = require('./exists_but_unregistered_test');

class ExistsButUnregisteredInvitedTest extends ExistsButUnregisteredTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.userOptions.numUnregistered = 0;
		this.teamOptions.numAdditionalInvites = 1;
	}

	get description () {
		return `should be ok to register a user using NR API key if a user record exists matching the email, but the user is unregistered and already invited to a team, under one-user-per-org`;
	}
}

module.exports = ExistsButUnregisteredInvitedTest;
