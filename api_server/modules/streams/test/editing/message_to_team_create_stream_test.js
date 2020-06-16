'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class MessageToTeamCreateStreamTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.dontWantExistingStream = true;
	}

	get description () {
		return 'members of the team should receive a message with the full stream when a user indicates they are editing a file, specified by path, and there is not yet a stream associated with the file';
	}
}

module.exports = MessageToTeamCreateStreamTest;
