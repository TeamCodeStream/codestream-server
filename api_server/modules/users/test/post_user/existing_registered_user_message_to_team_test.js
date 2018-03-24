'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class ExistingRegisteredUserMessageToTeamTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'members of the team should receive a message with the user when an existing registered user is added to the team';
	}

}

module.exports = ExistingRegisteredUserMessageToTeamTest;
