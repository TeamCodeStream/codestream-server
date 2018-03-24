'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class ExistingUnregisteredUserMessageToTeamTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
	}

	get description () {
		return 'members of the team should receive a message with the user when an existing unregistered user is added to the team';
	}

}

module.exports = ExistingUnregisteredUserMessageToTeamTest;
