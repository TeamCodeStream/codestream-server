'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class ExistingUnregisteredUserMessageToTeamTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
	}

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org' : ''; // ONE_USER_PER_ORG
		return `members of the team should receive a message with the user when an existing unregistered user is added to the team${oneUserPerOrg}`;
	}

}

module.exports = ExistingUnregisteredUserMessageToTeamTest;
