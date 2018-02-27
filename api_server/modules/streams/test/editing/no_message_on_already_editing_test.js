'use strict';

const MessageToTeamTest = require('./message_to_team_test');
const Assert = require('assert');

class NoMessageOnAlreadyEditingTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.wantAlreadyEditing = true;
	}

	get description () {
		return 'no message should be sent when the user indicates they are not editing a file that they have already indicated they are editing';
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NoMessageOnAlreadyEditingTest;
