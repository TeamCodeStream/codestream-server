'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class StopEditingMessageTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantAlreadyEditing = true;
		this.wantStopEditing = true;
	}

	get description () {
		return 'members of the team should receive a message with the op to remove the editingUsers entry for current user when that user indicates they are no longer editing a file';
	}
}

module.exports = StopEditingMessageTest;
